using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Security.Common;
using INK.ERP.Application.Features.Security.Risk.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Infrastructure.Options;

namespace INK.ERP.Infrastructure.Security.Risk;

public interface IRiskStrategy
{
    string StrategyName { get; }
    int Evaluate(AuthenticationContext context, List<string> reasons, List<string> triggeredPolicies, List<string> recommendedActions);
}

public sealed class FaceRiskStrategy : IRiskStrategy
{
    public string StrategyName => "FaceBiometricRisk";

    public int Evaluate(AuthenticationContext context, List<string> reasons, List<string> triggeredPolicies, List<string> recommendedActions)
    {
        if (context.SecurityPolicySnapshot != null && context.SecurityPolicySnapshot.FaceMode == "StrictMatching")
        {
            triggeredPolicies.Add("Policy: Strict Face Matching Required");
        }
        return 0;
    }
}

public sealed class GpsRiskStrategy : IRiskStrategy
{
    public string StrategyName => "GpsGeofenceRisk";

    public int Evaluate(AuthenticationContext context, List<string> reasons, List<string> triggeredPolicies, List<string> recommendedActions)
    {
        int score = 0;
        if (context.GpsAccuracy != null && context.GpsAccuracy.AccuracyInMeters > 100.0)
        {
            score += 20;
            reasons.Add("GPS accuracy is poor (>100m).");
            recommendedActions.Add("Request high-precision GPS refresh.");
        }
        return score;
    }
}

public sealed class DeviceRiskStrategy : IRiskStrategy
{
    public string StrategyName => "DeviceTrustRisk";

    public int Evaluate(AuthenticationContext context, List<string> reasons, List<string> triggeredPolicies, List<string> recommendedActions)
    {
        int score = 0;
        if (context.DeviceId == null)
        {
            score += 30;
            reasons.Add("Unregistered hardware device.");
            recommendedActions.Add("Prompt user to complete device registration.");
        }
        return score;
    }
}

public sealed class BehaviorRiskStrategy : IRiskStrategy
{
    public string StrategyName => "UserBehaviorRisk";

    public int Evaluate(AuthenticationContext context, List<string> reasons, List<string> triggeredPolicies, List<string> recommendedActions)
    {
        // Anomaly behavior check
        return 0;
    }
}

public sealed class PolicyRiskStrategy : IRiskStrategy
{
    public string StrategyName => "SecurityPolicyCompliance";

    public int Evaluate(AuthenticationContext context, List<string> reasons, List<string> triggeredPolicies, List<string> recommendedActions)
    {
        if (context.SecurityPolicySnapshot != null && context.SecurityPolicySnapshot.RequireDeviceRegistration && context.DeviceId == null)
        {
            triggeredPolicies.Add("Policy: Device Registration Mandatory");
            return 25;
        }
        return 0;
    }
}

public sealed class RiskEngine : IRiskEngine
{
    private readonly SecurityRiskOptions _options;
    private readonly IEnumerable<IRiskStrategy> _strategies;
    private readonly ILogger<RiskEngine> _logger;

    public RiskEngine(
        IOptions<SecurityRiskOptions> options,
        IEnumerable<IRiskStrategy> strategies,
        ILogger<RiskEngine> logger)
    {
        _options = options.Value;
        _strategies = strategies;
        _logger = logger;
    }

    public Task<Result<RiskAssessmentDto>> AssessRiskAsync(AuthenticationContext context, CancellationToken cancellationToken = default)
    {
        if (context == null)
        {
            return Task.FromResult(Result.Failure<RiskAssessmentDto>(new Error("SECURITY.RISK.INVALID_CONTEXT", "Authentication context is required.", ErrorType.Validation)));
        }

        var reasons = new List<string>();
        var triggeredPolicies = new List<string>();
        var recommendedActions = new List<string>();

        int totalScore = 0;
        foreach (var strategy in _strategies)
        {
            int strategyScore = strategy.Evaluate(context, reasons, triggeredPolicies, recommendedActions);
            totalScore += strategyScore;
            _logger.LogDebug("Risk strategy '{Strategy}' evaluated score: {Score}", strategy.StrategyName, strategyScore);
        }

        totalScore = Math.Min(totalScore, 100);

        var level = totalScore switch
        {
            >= 90 => "Critical",
            >= 75 => "High",
            >= 30 => "Medium",
            _ => "Low"
        };

        if (totalScore >= _options.HighRiskThreshold)
        {
            recommendedActions.Add("Enforce Step-Up Multi-Factor Authentication (MFA).");
        }

        _logger.LogInformation("RiskEngine evaluated score {Score}/100 [{Level}] for User {UserId} across {Count} strategies.", totalScore, level, context.UserId, _strategies.Count());

        var dto = new RiskAssessmentDto(
            context.UserId,
            totalScore,
            level,
            totalScore >= 75,
            reasons,
            DateTime.UtcNow);

        return Task.FromResult(Result.Success(dto));
    }
}

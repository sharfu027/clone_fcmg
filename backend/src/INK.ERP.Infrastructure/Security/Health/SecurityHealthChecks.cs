using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Infrastructure.Options;
using INK.ERP.Infrastructure.Security.Face;

namespace INK.ERP.Infrastructure.Security.Health;

public sealed class EncryptionHealthCheck : IHealthCheck
{
    private readonly IFaceTemplateProtectionService _protectionService;

    public EncryptionHealthCheck(IFaceTemplateProtectionService protectionService)
    {
        _protectionService = protectionService;
    }

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            string testVector = "0.1,0.2,0.3";
            string encrypted = _protectionService.EncryptEmbedding(testVector);
            string decrypted = _protectionService.DecryptEmbedding(encrypted);

            if (decrypted == testVector && _protectionService.ValidatePayloadFormat(encrypted))
            {
                return Task.FromResult(HealthCheckResult.Healthy("AES-256 Envelope Encryption engine operational."));
            }
            return Task.FromResult(HealthCheckResult.Unhealthy("Encryption roundtrip payload mismatch."));
        }
        catch (Exception ex)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("Encryption engine failure.", ex));
        }
    }
}

public sealed class RiskEngineHealthCheck : IHealthCheck
{
    private readonly IRiskEngine _riskEngine;

    public RiskEngineHealthCheck(IRiskEngine riskEngine)
    {
        _riskEngine = riskEngine;
    }

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_riskEngine != null
            ? HealthCheckResult.Healthy("Risk Engine Strategy Registry operational.")
            : HealthCheckResult.Unhealthy("Risk Engine service unavailable."));
    }
}

public sealed class OnnxRuntimeHealthCheck : IHealthCheck
{
    private readonly IModelLoader _modelLoader;

    public OnnxRuntimeHealthCheck(IModelLoader modelLoader)
    {
        _modelLoader = modelLoader;
    }

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        if (_modelLoader.IsLoaded)
        {
            return Task.FromResult(HealthCheckResult.Healthy($"ONNX Runtime Execution Provider '{_modelLoader.ExecutionProvider}' active."));
        }
        return Task.FromResult(HealthCheckResult.Degraded("ONNX Runtime Model pending lazy load."));
    }
}

public sealed class GpsHealthCheck : IHealthCheck
{
    private readonly GpsOptions _options;

    public GpsHealthCheck(IOptions<GpsOptions> options)
    {
        _options = options.Value;
    }

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var data = new Dictionary<string, object>
        {
            ["MaxAccuracyMeters"] = _options.MaxAllowedAccuracyMeters,
            ["MaxSpeedKmH"] = _options.MaxSpeedKmH,
            ["SpoofDetectionEnabled"] = _options.EnableSpoofDetection
        };

        return Task.FromResult(HealthCheckResult.Healthy("GPS Verification service operational.", data));
    }
}

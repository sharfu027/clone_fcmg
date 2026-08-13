namespace INK.ERP.Application.Features.Security.Risk.DTOs;

public sealed record RiskAssessmentDto(
    Guid UserId,
    int RiskScore,
    string RiskLevel,
    bool HighRiskDetected,
    IReadOnlyList<string> RiskFactors,
    DateTime EvaluatedAtUtc);

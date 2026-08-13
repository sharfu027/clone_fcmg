namespace INK.ERP.Application.Features.Security.Face.DTOs;

public sealed record FaceValidationResult(
    bool IsValid,
    float QualityScore,
    bool LivenessDetected,
    IReadOnlyList<string> ValidationErrors);

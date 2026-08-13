namespace INK.ERP.Application.Features.Security.Face.DTOs;

public sealed record FaceVerificationSummaryDto(
    Guid UserId,
    int TotalVerifications,
    int SuccessfulVerifications,
    int FailedVerifications,
    float AverageMatchScore,
    DateTime? LastVerificationUtc);

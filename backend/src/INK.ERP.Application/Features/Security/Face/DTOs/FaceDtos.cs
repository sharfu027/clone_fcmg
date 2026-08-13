namespace INK.ERP.Application.Features.Security.Face.DTOs;

public sealed record FaceTemplateDto(
    Guid Id,
    int Version,
    string AlgorithmVersion,
    float QualityScore,
    bool IsActive,
    DateTime CreatedAtUtc);

public sealed record FaceVerificationDto(
    Guid Id,
    float MatchScore,
    bool IsSuccessful,
    string? DeviceId,
    string? FailureReason,
    DateTime CreatedAtUtc);

public sealed record EnrollmentHistoryDto(
    Guid Id,
    int TemplateVersion,
    string Status,
    string? Notes,
    DateTime CreatedAtUtc);

public sealed record FaceProfileDto(
    Guid Id,
    Guid UserId,
    string Status,
    bool IsActive,
    int ActiveTemplateVersion,
    IReadOnlyList<FaceTemplateDto> Templates);

public sealed record FaceVerificationResultDto(
    bool Success,
    float SimilarityScore,
    float ConfidenceScore,
    string Message,
    string? FailureReason,
    long ProcessingTimeMs);

public sealed record VerifyFaceRequest(
    string? UserId,
    string? ImageBase64,
    string? ImageBlob,
    string? DeviceId);


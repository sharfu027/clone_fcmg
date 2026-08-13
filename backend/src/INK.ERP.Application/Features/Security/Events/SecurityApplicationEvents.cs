using MediatR;

namespace INK.ERP.Application.Features.Security.Events;

public sealed record FaceEnrollmentCompletedEvent(
    Guid ProfileId,
    Guid UserId,
    int TemplateVersion,
    DateTime CompletedAtUtc) : INotification;

public sealed record FaceVerificationCompletedEvent(
    Guid UserId,
    float MatchScore,
    bool IsSuccess,
    string? DeviceId,
    DateTime CompletedAtUtc) : INotification;

public sealed record RiskAssessmentCompletedEvent(
    Guid UserId,
    int RiskScore,
    string RiskLevel,
    DateTime CompletedAtUtc) : INotification;

public sealed record DeviceApprovedCompletedEvent(
    Guid DeviceId,
    Guid UserId,
    string ApprovedBy,
    DateTime CompletedAtUtc) : INotification;

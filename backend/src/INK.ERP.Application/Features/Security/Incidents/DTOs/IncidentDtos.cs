namespace INK.ERP.Application.Features.Security.Incidents.DTOs;

public sealed record SecurityIncidentDto(
    Guid Id,
    string Type,
    string Severity,
    string Description,
    Guid? UserId,
    string? IpAddress,
    bool IsResolved,
    bool IsEscalated,
    string? ResolutionNotes,
    DateTime? ResolvedAtUtc,
    DateTime CreatedAtUtc);

public sealed record IncidentTimelineDto(
    Guid IncidentId,
    string Type,
    string Severity,
    string EventDescription,
    DateTime Timestamp);

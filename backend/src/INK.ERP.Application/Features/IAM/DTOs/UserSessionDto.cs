namespace INK.ERP.Application.Features.IAM.DTOs;

public sealed record UserSessionDto(
    Guid Id,
    Guid UserId,
    string JwtId,
    string Device,
    string Browser,
    string OperatingSystem,
    string IpAddress,
    string? Location,
    DateTime StartedUtc,
    DateTime LastActivityUtc,
    DateTime? EndedUtc);

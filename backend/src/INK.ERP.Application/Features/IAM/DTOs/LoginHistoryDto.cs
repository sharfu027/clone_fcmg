namespace INK.ERP.Application.Features.IAM.DTOs;

public sealed record LoginHistoryDto(
    Guid Id,
    Guid? UserId,
    string Username,
    bool IsSuccessful,
    string FailureReason,
    string Browser,
    string Device,
    string OperatingSystem,
    string IpAddress,
    string? Country,
    decimal? Latitude,
    decimal? Longitude,
    DateTime CreatedAtUtc);

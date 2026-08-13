namespace INK.ERP.Application.Features.Security.Device.DTOs;

public sealed record RegisteredDeviceDto(
    Guid Id,
    Guid UserId,
    string DeviceName,
    string FingerprintHash,
    string ClientType,
    string DeviceModel,
    string OperatingSystem,
    string Status,
    string? ApprovedBy,
    DateTime? ApprovedAtUtc,
    DateTime? LastHeartbeatUtc,
    string? LastIpAddress);

public sealed record DeviceHistoryDto(
    Guid DeviceId,
    string Status,
    string? LastIpAddress,
    DateTime? LastHeartbeatUtc,
    DateTime CreatedAtUtc);

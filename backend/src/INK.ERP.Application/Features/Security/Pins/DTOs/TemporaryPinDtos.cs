using System;
using System.Security.Cryptography;
using System.Text;

namespace INK.ERP.Application.Features.Security.Pins.DTOs;

public record TemporaryPinDto(
    Guid Id,
    Guid CompanyId,
    Guid? EmployeeId,
    string? EmployeeName,
    string Purpose,
    string GeneratedByUserName,
    DateTime ExpiresAtUtc,
    bool IsUsed,
    DateTime? UsedAtUtc,
    DateTime CreatedAtUtc,
    string? PlainPin = null
);

public record GenerateTemporaryPinRequest(
    Guid CompanyId,
    Guid? EmployeeId = null,
    string Purpose = "SalesLogin",
    int ExpiryMinutes = 30
);

public record ValidateTemporaryPinRequest(
    Guid CompanyId,
    string Pin,
    Guid? EmployeeId = null,
    string? DeviceId = null
);

public record ValidateTemporaryPinResultDto(
    bool IsValid,
    string Message,
    Guid? PinId,
    DateTime? ValidatedAtUtc
);

public record ValidateLoginLocationRequest(
    Guid CompanyId,
    Guid? EmployeeId,
    double Latitude,
    double Longitude,
    double? AccuracyMeters = null,
    double? MaxAllowedRadiusMeters = null
);

public record ValidateLoginLocationResultDto(
    bool IsAllowed,
    double DistanceMeters,
    double AllowedRadiusMeters,
    string Message,
    bool RequiresPinOverride,
    string? TargetLocationName = null
);

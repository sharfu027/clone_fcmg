namespace INK.ERP.Application.Features.Security.Policies.DTOs;

public sealed record SecurityPolicyDto(
    Guid Id,
    string Name,
    bool IsActive,
    string FaceMode,
    float MinFaceConfidenceScore,
    string GpsMode,
    double MaxAllowedGpsRadiusMeters,
    int PasswordMinLength,
    bool PasswordRequireSpecialChar,
    int LockoutThresholdAttempts,
    string AttendanceMode,
    bool RequireDeviceRegistration,
    int MaxDevicesPerUser);

public sealed record EffectiveSecurityPolicyDto(
    string FaceMode,
    float MinFaceConfidenceScore,
    string GpsMode,
    double MaxAllowedGpsRadiusMeters,
    string AttendanceMode,
    bool RequireDeviceRegistration);

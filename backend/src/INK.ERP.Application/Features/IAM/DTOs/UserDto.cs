namespace INK.ERP.Application.Features.IAM.DTOs;

public sealed record UserDto(
    Guid Id,
    string Username,
    string Email,
    string? PhoneNumber,
    string FirstName,
    string LastName,
    string DisplayName,
    Guid? EmployeeId,
    bool IsActive,
    bool IsLocked,
    bool IsDeleted,
    DateTime? LastLoginUtc,
    bool TwoFactorEnabled,
    bool EmailConfirmed,
    bool RequirePasswordChange,
    string PreferredLanguage,
    string TimeZone,
    string? ProfileImageUrl,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc,
    IReadOnlyList<string> Roles);

namespace INK.ERP.Application.Features.IAM.DTOs;

public sealed record UserPreferenceDto(
    Guid Id,
    Guid UserId,
    string Theme,
    string Language,
    string TimeZone,
    string DateFormat,
    string NumberFormat,
    string? NotificationPreferences);

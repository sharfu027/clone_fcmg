using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class UserPreference : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Theme { get; set; } = "Light";
    public string Language { get; set; } = "en";
    public string TimeZone { get; set; } = "UTC";
    public string DateFormat { get; set; } = "yyyy-MM-dd";
    public string NumberFormat { get; set; } = "en-US";
    public string NotificationPreferences { get; set; } = "{\"email\":true,\"push\":false}";

    // Navigation
    public ApplicationUser? User { get; set; }
}

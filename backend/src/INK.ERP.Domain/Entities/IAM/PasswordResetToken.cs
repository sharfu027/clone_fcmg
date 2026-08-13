using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class PasswordResetToken : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime Expiry { get; set; }
    public DateTime? UsedUtc { get; set; }

    // Navigation
    public ApplicationUser? User { get; set; }
}

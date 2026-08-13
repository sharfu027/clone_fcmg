using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class EmailVerificationToken : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime Expiry { get; set; }
    public DateTime? VerifiedUtc { get; set; }

    // Navigation
    public ApplicationUser? User { get; set; }
}

using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class UserSession : AuditableEntity
{
    public Guid UserId { get; set; }
    public string JwtId { get; set; } = string.Empty;
    public Guid? RefreshTokenId { get; set; }
    public string Device { get; set; } = string.Empty;
    public string Browser { get; set; } = string.Empty;
    public string OperatingSystem { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime StartedUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastActivityUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EndedUtc { get; set; }

    // Navigation
    public ApplicationUser? User { get; set; }
}

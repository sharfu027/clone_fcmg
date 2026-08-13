using System;
using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class RefreshToken : AuditableEntity
{
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string? FamilyId { get; set; }
    public DateTime ExpiresUtc { get; set; }
    public DateTime? RevokedUtc { get; set; }
    public bool IsRevoked => RevokedUtc != null;
    public string CreatedByIp { get; set; } = string.Empty;
    public string? RevokedByIp { get; set; }
    public string? ReplacedByToken { get; set; }
    public string? ReasonRevoked { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresUtc;
    public bool IsActiveToken => RevokedUtc == null && !IsExpired;

    // Navigation
    public ApplicationUser? User { get; set; }
}

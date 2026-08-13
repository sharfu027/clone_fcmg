using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class UserRole : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }

    // Navigation
    public ApplicationUser? User { get; set; }
    public ApplicationRole? Role { get; set; }
}

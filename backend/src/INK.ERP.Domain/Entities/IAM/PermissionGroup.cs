using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class PermissionGroup : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // e.g. USERS, ROLES, PRODUCTS
    public string Description { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
}

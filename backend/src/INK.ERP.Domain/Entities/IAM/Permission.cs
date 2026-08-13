using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class Permission : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // e.g. users:create, users:read
    public string Description { get; set; } = string.Empty;
    public Guid PermissionGroupId { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    // Navigation
    public PermissionGroup? PermissionGroup { get; set; }
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class RolePermission : AuditableEntity
{
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }

    // Navigation
    public ApplicationRole? Role { get; set; }
    public Permission? Permission { get; set; }
}

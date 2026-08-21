using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class AdminCompanyAssignment : BaseEntity
{
    public Guid AdminUserId { get; set; }
    public Guid CompanyId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;
    public Guid? AssignedByUserId { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public Guid? RevokedByUserId { get; set; }

    // Navigation Properties
    public ApplicationUser AdminUser { get; set; } = null!;
    public Company Company { get; set; } = null!;
}

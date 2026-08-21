using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Department : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid? BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Company? Company { get; set; }
    public Branch? Branch { get; set; }
}

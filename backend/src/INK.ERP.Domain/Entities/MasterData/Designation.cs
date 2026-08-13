using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Designation : BaseEntity
{
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public decimal? ApprovalLimit { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Property
    public Company? Company { get; set; }
}

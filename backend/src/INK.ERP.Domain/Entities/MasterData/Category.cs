using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Category : BaseEntity
{
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? ParentCategoryId { get; set; }
    public decimal GstTaxRatePercent { get; set; } = 5.0m;
    public string HsnCodeDefault { get; set; } = "1006";
    public bool IsActive { get; set; } = true;

    // Navigation Property
    public Company? Company { get; set; }
    public Category? ParentCategory { get; set; }
}

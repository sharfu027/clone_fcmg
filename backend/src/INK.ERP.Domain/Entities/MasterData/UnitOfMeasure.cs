using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class UnitOfMeasure : BaseEntity
{
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BaseUnitCode { get; set; } = string.Empty;
    public decimal ConversionFactor { get; set; } = 1.0m;
    public bool IsFractionalAllowed { get; set; } = false;
    public bool IsActive { get; set; } = true;

    // Navigation Property
    public Company? Company { get; set; }
}

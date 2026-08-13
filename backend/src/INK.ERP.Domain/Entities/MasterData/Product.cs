using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Product : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public Guid BaseUomId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string HsnCode { get; set; } = "1006";
    public decimal GstRatePercent { get; set; } = 5.0m;
    public decimal Mrp { get; set; }
    public decimal BasePrice { get; set; }
    public decimal MinOrderQty { get; set; } = 1.0m;
    public int? ShelfLifeDays { get; set; }
    public bool IsBatchTracked { get; set; } = true;
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Company? Company { get; set; }
    public Category? Category { get; set; }
    public Brand? Brand { get; set; }
    public UnitOfMeasure? BaseUom { get; set; }
}

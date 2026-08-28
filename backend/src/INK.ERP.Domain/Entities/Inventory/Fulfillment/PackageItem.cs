using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Inventory.Fulfillment;

public sealed class PackageItem : BaseEntity
{
    public Guid PackageId { get; set; }
    public Guid ProductId { get; set; }
    public decimal PackedQuantity { get; set; }
    public string? BatchNumber { get; set; }

    // Navigation Properties
    public Package? Package { get; set; }
    public Product? Product { get; set; }
}

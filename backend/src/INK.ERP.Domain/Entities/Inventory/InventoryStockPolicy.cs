using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Inventory;

public sealed class InventoryStockPolicy : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid InventoryLocationId { get; set; }
    public Guid ProductId { get; set; }
    public decimal MinStockQuantity { get; set; } = 0;
    public decimal? ReorderPoint { get; set; }
    public decimal? ReorderQuantity { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Company? Company { get; set; }
    public InventoryLocation? InventoryLocation { get; set; }
    public INK.ERP.Domain.Entities.MasterData.Product? Product { get; set; }
}

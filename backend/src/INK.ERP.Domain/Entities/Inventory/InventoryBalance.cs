using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Inventory;

public sealed class InventoryBalance : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid InventoryLocationId { get; set; }
    public Guid ProductId { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal OnHandQuantity { get; set; } = 0;
    public decimal ReservedQuantity { get; set; } = 0;
    public decimal AllocatedQuantity { get; set; } = 0;
    public decimal MinStockQuantity { get; set; } = 0;
    public DateTime? LastMovementAtUtc { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public InventoryLocation? InventoryLocation { get; set; }
    public INK.ERP.Domain.Entities.MasterData.Product? Product { get; set; }
}

using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Inventory.Fulfillment;

public sealed class DispatchLine : BaseEntity
{
    public Guid DispatchId { get; set; }
    public Guid ProductId { get; set; }
    public decimal DispatchedQuantity { get; set; }
    public string? BatchNumber { get; set; }

    // Navigation Properties
    public Dispatch? Dispatch { get; set; }
    public Product? Product { get; set; }
}

using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Inventory;

public sealed class StockTransferLine : BaseEntity
{
    public Guid StockTransferId { get; set; }
    public Guid ProductId { get; set; }

    /// <summary>Quantity originally requested in the transfer.</summary>
    public decimal RequestedQuantity { get; set; }

    /// <summary>Quantity approved by the approver (may differ from requested).</summary>
    public decimal ApprovedQuantity { get; set; }

    /// <summary>Quantity actually dispatched from source (≤ ApprovedQuantity).</summary>
    public decimal DispatchedQuantity { get; set; }

    /// <summary>Quantity received at destination so far (supports partial receives).</summary>
    public decimal ReceivedQuantity { get; set; }

    // Navigation Properties
    public StockTransfer? StockTransfer { get; set; }
    public Product? Product { get; set; }
}

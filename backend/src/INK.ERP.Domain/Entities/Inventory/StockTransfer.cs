using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Domain.Entities.Inventory;

public static class StockTransferStatuses
{
    public const string Draft = "Draft";
    public const string Requested = "Requested";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Dispatched = "Dispatched";
    public const string InTransit = "InTransit";
    public const string Received = "Received";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Draft, Requested, Approved, Rejected, Dispatched,
        InTransit, Received, Completed, Cancelled
    ];

    /// <summary>Statuses that can be cancelled without physical inventory impact.</summary>
    public static readonly string[] CancellableStatuses = [Draft, Requested, Approved];

    /// <summary>Statuses where physical stock movement has occurred — cannot be simply cancelled.</summary>
    public static readonly string[] InFlightStatuses = [Dispatched, InTransit, Received];
}

public sealed class StockTransfer : BaseEntity
{
    public Guid CompanyId { get; set; }
    public string TransferNumber { get; set; } = string.Empty;
    public Guid SourceLocationId { get; set; }
    public Guid DestinationLocationId { get; set; }
    public Guid? SalesOrderId { get; set; }
    public string Status { get; set; } = StockTransferStatuses.Requested;
    public Guid RequestedByEmployeeId { get; set; }
    public Guid? ApprovedByEmployeeId { get; set; }
    public DateTime? DispatchedAtUtc { get; set; }
    public DateTime? ReceivedAtUtc { get; set; }
    public string? Notes { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public InventoryLocation? SourceLocation { get; set; }
    public InventoryLocation? DestinationLocation { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public Employee? RequestedByEmployee { get; set; }
    public Employee? ApprovedByEmployee { get; set; }
    public ICollection<StockTransferLine> Lines { get; set; } = new List<StockTransferLine>();
}

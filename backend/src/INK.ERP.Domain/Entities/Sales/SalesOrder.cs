using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Domain.Entities.Sales;

public static class SalesOrderStatuses
{
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string StockChecking = "StockChecking";
    public const string PartiallyAvailable = "PartiallyAvailable";
    public const string AwaitingTransfer = "AwaitingTransfer";
    public const string Reserved = "Reserved";
    public const string ReadyForFulfillment = "ReadyForFulfillment";
    public const string Picking = "Picking";
    public const string Picked = "Picked";
    public const string Packing = "Packing";
    public const string Packed = "Packed";
    public const string Dispatched = "Dispatched";
    public const string PartiallyDispatched = "PartiallyDispatched";
    public const string Cancelled = "Cancelled";
    public const string Completed = "Completed";

    public static readonly string[] All =
    [
        Draft, Submitted, StockChecking, PartiallyAvailable,
        AwaitingTransfer, Reserved, ReadyForFulfillment,
        Picking, Picked, Packing, Packed, Dispatched, PartiallyDispatched,
        Cancelled, Completed
    ];
}

public sealed class SalesOrder : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? SalesEmployeeId { get; set; }
    public Guid? InventoryLocationId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = SalesOrderStatuses.Draft;
    public DateTime OrderDateUtc { get; set; } = DateTime.UtcNow;
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public Customer? Customer { get; set; }
    public Employee? SalesEmployee { get; set; }
    public InventoryLocation? InventoryLocation { get; set; }
    public ICollection<SalesOrderItem> Items { get; set; } = new List<SalesOrderItem>();
}

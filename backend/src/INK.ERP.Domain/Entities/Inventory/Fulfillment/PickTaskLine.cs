using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Domain.Entities.Inventory.Fulfillment;

public static class PickTaskLineStatuses
{
    public const string Pending = "Pending";
    public const string Picked = "Picked";
    public const string ShortPicked = "ShortPicked";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Pending,
        Picked,
        ShortPicked,
        Cancelled
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) && Array.Exists(All, s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
}

public sealed class PickTaskLine : BaseEntity
{
    public Guid PickTaskId { get; set; }
    public Guid SalesOrderLineId { get; set; }
    public Guid ProductId { get; set; }
    public decimal RequestedQuantity { get; set; }
    public decimal AllocatedQuantity { get; set; }
    public decimal PickedQuantity { get; set; }
    public decimal ShortQuantity { get; set; }
    public string Status { get; set; } = PickTaskLineStatuses.Pending;
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }

    // Navigation Properties
    public PickTask? PickTask { get; set; }
    public SalesOrderItem? SalesOrderLine { get; set; }
    public Product? Product { get; set; }
}

using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Inventory;

public static class InventoryReservationStatuses
{
    public const string Pending = "Pending";
    public const string Active = "Active";
    public const string Allocated = "Allocated";
    public const string Fulfilled = "Fulfilled";
    public const string Released = "Released";
    public const string Cancelled = "Cancelled";
    public const string Expired = "Expired";

    public static readonly string[] All =
    [
        Pending,
        Active,
        Allocated,
        Fulfilled,
        Released,
        Cancelled,
        Expired
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) && Array.Exists(All, s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
}

public sealed class InventoryReservation : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid? SalesOrderId { get; set; }
    public Guid? SalesOrderLineId { get; set; }
    public Guid InventoryLocationId { get; set; }
    public Guid ProductId { get; set; }
    public string? BatchNumber { get; set; }
    public decimal ReservedQuantity { get; set; }
    public string Status { get; set; } = InventoryReservationStatuses.Active;
    public DateTime ReservedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReleasedAtUtc { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public InventoryLocation? InventoryLocation { get; set; }
    public INK.ERP.Domain.Entities.MasterData.Product? Product { get; set; }
}

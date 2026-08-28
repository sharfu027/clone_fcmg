using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Domain.Entities.Inventory.Fulfillment;

public static class PickTaskStatuses
{
    public const string Pending = "Pending";
    public const string Assigned = "Assigned";
    public const string InProgress = "InProgress";
    public const string PartiallyPicked = "PartiallyPicked";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Pending,
        Assigned,
        InProgress,
        PartiallyPicked,
        Completed,
        Cancelled
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) && Array.Exists(All, s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
}

public sealed class PickTask : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid InventoryLocationId { get; set; }
    public string PickTaskNumber { get; set; } = string.Empty;
    public Guid? AssignedEmployeeId { get; set; }
    public string Status { get; set; } = PickTaskStatuses.Pending;
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? Notes { get; set; }
    public string ConcurrencyToken { get; set; } = Guid.NewGuid().ToString();

    // Navigation Properties
    public Company? Company { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public InventoryLocation? InventoryLocation { get; set; }
    public Employee? AssignedEmployee { get; set; }
    public ICollection<PickTaskLine> Lines { get; set; } = new List<PickTaskLine>();
}

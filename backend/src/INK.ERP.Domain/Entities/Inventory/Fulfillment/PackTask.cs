using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Domain.Entities.Inventory.Fulfillment;

public static class PackTaskStatuses
{
    public const string Pending = "Pending";
    public const string Assigned = "Assigned";
    public const string InProgress = "InProgress";
    public const string Packed = "Packed";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Pending,
        Assigned,
        InProgress,
        Packed,
        Cancelled
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) && Array.Exists(All, s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
}

public sealed class PackTask : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid PickTaskId { get; set; }
    public string PackTaskNumber { get; set; } = string.Empty;
    public Guid? AssignedEmployeeId { get; set; }
    public string Status { get; set; } = PackTaskStatuses.Pending;
    public int TotalPackagesCount { get; set; } = 0;
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? Notes { get; set; }
    public string ConcurrencyToken { get; set; } = Guid.NewGuid().ToString();

    // Navigation Properties
    public Company? Company { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public PickTask? PickTask { get; set; }
    public Employee? AssignedEmployee { get; set; }
    public ICollection<Package> Packages { get; set; } = new List<Package>();
}

using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Domain.Entities.Inventory.Fulfillment;

public static class DispatchStatuses
{
    public const string Draft = "Draft";
    public const string ReadyForDispatch = "ReadyForDispatch";
    public const string Dispatched = "Dispatched";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Draft,
        ReadyForDispatch,
        Dispatched,
        Cancelled
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) && Array.Exists(All, s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
}

public sealed class Dispatch : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid? PackTaskId { get; set; }
    public string DispatchNumber { get; set; } = string.Empty;
    public string DispatchStatus { get; set; } = DispatchStatuses.Draft;
    public string? VehicleNumber { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? TransporterName { get; set; }
    public string? WaybillNumber { get; set; }
    public DateTime? DispatchedAtUtc { get; set; }
    public Guid? DispatchedByEmployeeId { get; set; }
    public string? Notes { get; set; }
    public string ConcurrencyToken { get; set; } = Guid.NewGuid().ToString();

    // Navigation Properties
    public Company? Company { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public PackTask? PackTask { get; set; }
    public Employee? DispatchedByEmployee { get; set; }
    public ICollection<DispatchLine> Lines { get; set; } = new List<DispatchLine>();
}

using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Domain.Entities.Sales;

public static class DeliveryStatuses
{
    public const string Dispatched = "Dispatched";
    public const string InTransit = "InTransit";
    public const string OutForDelivery = "OutForDelivery";
    public const string Delivered = "Delivered";
    public const string Failed = "Failed";

    public static readonly string[] All = [Dispatched, InTransit, OutForDelivery, Delivered, Failed];
}

public sealed class DeliveryTracking : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid? DispatchId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string Status { get; set; } = DeliveryStatuses.Dispatched;
    public string? CarrierName { get; set; }
    public string? VehicleNumber { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public DateTime? EstimatedDeliveryUtc { get; set; }
    public DateTime? ActualDeliveryUtc { get; set; }
    public string? ReceivedByPerson { get; set; }
    public string? SignatureProofUrl { get; set; }
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public string? Notes { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public Dispatch? Dispatch { get; set; }
}

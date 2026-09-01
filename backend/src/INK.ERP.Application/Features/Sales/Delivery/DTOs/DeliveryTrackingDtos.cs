using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Features.Sales.Delivery.DTOs;

public record DeliveryTrackingDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    Guid SalesOrderId,
    string SalesOrderNumber,
    Guid? CustomerId,
    string? CustomerName,
    Guid? DispatchId,
    string TrackingNumber,
    string Status,
    string? CarrierName,
    string? VehicleNumber,
    string? DriverName,
    string? DriverPhone,
    DateTime? EstimatedDeliveryUtc,
    DateTime? ActualDeliveryUtc,
    string? ReceivedByPerson,
    string? SignatureProofUrl,
    double? CurrentLatitude,
    double? CurrentLongitude,
    string? Notes,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc
);

public record UpdateDeliveryStatusRequest(
    string Status,
    string? CarrierName = null,
    string? VehicleNumber = null,
    string? DriverName = null,
    string? DriverPhone = null,
    string? ReceivedByPerson = null,
    string? SignatureProofUrl = null,
    double? CurrentLatitude = null,
    double? CurrentLongitude = null,
    string? Notes = null
);

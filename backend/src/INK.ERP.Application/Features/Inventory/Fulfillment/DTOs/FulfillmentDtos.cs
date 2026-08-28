using System;
using System.Collections.Generic;

namespace INK.ERP.Application.Features.Inventory.Fulfillment.DTOs;

public record ReadyForFulfillmentOrderDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    Guid CustomerId,
    string CustomerName,
    string CustomerCode,
    Guid? SalesEmployeeId,
    string? SalesEmployeeName,
    Guid? InventoryLocationId,
    string? InventoryLocationName,
    string? InventoryLocationCode,
    string OrderNumber,
    string OrderStatus,
    DateTime OrderDateUtc,
    decimal TotalAmount,
    int ItemsCount,
    decimal TotalQuantity,
    decimal TotalReservedQuantity,
    bool HasActivePickTask,
    Guid? ActivePickTaskId,
    string? ActivePickTaskNumber,
    string? ActivePickTaskStatus,
    List<ReadyForFulfillmentOrderItemDto> Items
);

public record ReadyForFulfillmentOrderItemDto(
    Guid OrderLineId,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? Sku,
    string UomName,
    decimal RequestedQuantity,
    decimal ReservedQuantity,
    decimal UnitPrice,
    decimal LineTotal
);

public record PickTaskDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    Guid SalesOrderId,
    string SalesOrderNumber,
    Guid CustomerId,
    string CustomerName,
    Guid InventoryLocationId,
    string InventoryLocationName,
    string InventoryLocationCode,
    string PickTaskNumber,
    Guid? AssignedEmployeeId,
    string? AssignedEmployeeName,
    string? AssignedEmployeeCode,
    string Status,
    DateTime? StartedAtUtc,
    DateTime? CompletedAtUtc,
    string? Notes,
    string ConcurrencyToken,
    DateTime CreatedAtUtc,
    List<PickTaskLineDto> Lines
);

public record PickTaskLineDto(
    Guid Id,
    Guid PickTaskId,
    Guid SalesOrderLineId,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? Sku,
    string UomName,
    decimal RequestedQuantity,
    decimal AllocatedQuantity,
    decimal PickedQuantity,
    decimal ShortQuantity,
    string Status,
    string? BatchNumber,
    DateTime? ExpiryDate
);

public record PackTaskDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    Guid SalesOrderId,
    string SalesOrderNumber,
    Guid CustomerId,
    string CustomerName,
    Guid PickTaskId,
    string PickTaskNumber,
    string PackTaskNumber,
    Guid? AssignedEmployeeId,
    string? AssignedEmployeeName,
    string? AssignedEmployeeCode,
    string Status,
    int TotalPackagesCount,
    DateTime? StartedAtUtc,
    DateTime? CompletedAtUtc,
    string? Notes,
    string ConcurrencyToken,
    DateTime CreatedAtUtc,
    List<PackageDto> Packages
);

public record PackageDto(
    Guid Id,
    Guid PackTaskId,
    string PackageNumber,
    string PackageType,
    decimal? GrossWeightKg,
    decimal? Length,
    decimal? Width,
    decimal? Height,
    string? SealNumber,
    string? Barcode,
    Guid? PackedByEmployeeId,
    string? PackedByEmployeeName,
    DateTime? PackedAtUtc,
    List<PackageItemDto> Items
);

public record PackageItemDto(
    Guid Id,
    Guid PackageId,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? Sku,
    string UomName,
    decimal PackedQuantity,
    string? BatchNumber
);

public record DispatchDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    Guid SalesOrderId,
    string SalesOrderNumber,
    Guid CustomerId,
    string CustomerName,
    Guid? PackTaskId,
    string? PackTaskNumber,
    string DispatchNumber,
    string DispatchStatus,
    string? VehicleNumber,
    string? DriverName,
    string? DriverPhone,
    string? TransporterName,
    string? WaybillNumber,
    DateTime? DispatchedAtUtc,
    Guid? DispatchedByEmployeeId,
    string? DispatchedByEmployeeName,
    string? Notes,
    string ConcurrencyToken,
    DateTime CreatedAtUtc,
    List<DispatchLineDto> Lines
);

public record DispatchLineDto(
    Guid Id,
    Guid DispatchId,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? Sku,
    string UomName,
    decimal DispatchedQuantity,
    string? BatchNumber
);

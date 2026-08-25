using System;
using System.Collections.Generic;

namespace INK.ERP.Application.Features.Sales.Orders.DTOs;

public record SalesOrderItemDto(
    Guid Id,
    Guid SalesOrderId,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? ProductSku,
    string UomName,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal LineTotal,
    decimal AvailableQuantity = 0,
    decimal ReservedQuantity = 0,
    decimal ShortfallQuantity = 0,
    string StockStatus = "Available"
);

public record SalesOrderDto(
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
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal TotalAmount,
    string? Notes,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc,
    IReadOnlyList<SalesOrderItemDto> Items
);

public record CreateSalesOrderItemRequest(
    Guid ProductId,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountAmount = 0,
    decimal TaxAmount = 0
);

public record CreateSalesOrderRequest(
    Guid CompanyId,
    Guid CustomerId,
    Guid? SalesEmployeeId,
    Guid? InventoryLocationId,
    DateTime? OrderDateUtc,
    string? Notes,
    List<CreateSalesOrderItemRequest> Items
);

public record UpdateSalesOrderRequest(
    Guid? SalesEmployeeId,
    Guid? InventoryLocationId,
    DateTime? OrderDateUtc,
    string? Notes,
    List<CreateSalesOrderItemRequest> Items
);

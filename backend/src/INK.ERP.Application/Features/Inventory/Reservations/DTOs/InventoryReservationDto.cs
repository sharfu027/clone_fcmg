using System;

namespace INK.ERP.Application.Features.Inventory.Reservations.DTOs;

public record InventoryReservationDto(
    Guid Id,
    Guid CompanyId,
    Guid InventoryLocationId,
    string InventoryLocationName,
    string InventoryLocationCode,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? Sku,
    string? BaseUomName,
    decimal ReservedQuantity,
    string Status,
    Guid? SalesOrderId,
    Guid? SalesOrderLineId,
    DateTime ReservedAtUtc,
    DateTime? ReleasedAtUtc,
    DateTime? ExpiresAtUtc,
    DateTime CreatedAtUtc,
    string? BatchNumber = null
);

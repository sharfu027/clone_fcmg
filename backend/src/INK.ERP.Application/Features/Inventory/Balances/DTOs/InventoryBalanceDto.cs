using System;

namespace INK.ERP.Application.Features.Inventory.Balances.DTOs;

public record InventoryBalanceDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    Guid InventoryLocationId,
    string? InventoryLocationName,
    string? InventoryLocationCode,
    Guid ProductId,
    string? ProductName,
    string? ProductCode,
    string? Sku,
    Guid BaseUomId,
    string? BaseUomName,
    string? BatchNumber,
    DateTime? ExpiryDate,
    decimal OnHandQuantity,
    decimal ReservedQuantity,
    decimal AllocatedQuantity,
    decimal AvailableQuantity,
    DateTime? LastMovementAtUtc,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc,
    decimal MinStockQuantity = 0m,
    decimal TotalLocationAvailableQuantity = 0m);

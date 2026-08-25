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
    decimal OnHandQuantity,
    decimal ReservedQuantity,
    decimal AllocatedQuantity,
    decimal AvailableQuantity,
    DateTime? LastMovementAtUtc,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc);

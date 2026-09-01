using System;

namespace INK.ERP.Application.Features.Inventory.Policies.DTOs;

public record InventoryStockPolicyDto(
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
    decimal MinStockQuantity,
    decimal? ReorderPoint,
    decimal? ReorderQuantity,
    bool IsActive,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc);

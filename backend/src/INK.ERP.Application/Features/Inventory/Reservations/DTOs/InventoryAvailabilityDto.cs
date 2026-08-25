using System;

namespace INK.ERP.Application.Features.Inventory.Reservations.DTOs;

public record InventoryAvailabilityDto(
    Guid CompanyId,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? Sku,
    string? BaseUomName,
    Guid InventoryLocationId,
    string InventoryLocationName,
    string InventoryLocationCode,
    decimal OnHandQuantity,
    decimal ReservedQuantity,
    decimal AllocatedQuantity,
    decimal AvailableQuantity,
    decimal RequestedQuantity,
    bool IsAvailable,
    decimal ShortfallQuantity
);

public record InventoryAlternativeLocationDto(
    Guid InventoryLocationId,
    string LocationCode,
    string LocationName,
    string LocationType,
    Guid CompanyId,
    string? CompanyName,
    Guid? BranchId,
    string? BranchName,
    Guid? WarehouseId,
    string? WarehouseName,
    Guid? DepartmentId,
    string? DepartmentName,
    decimal OnHandQuantity,
    decimal ReservedQuantity,
    decimal AllocatedQuantity,
    decimal AvailableQuantity,
    int RecommendedRank,
    string RankReason
);

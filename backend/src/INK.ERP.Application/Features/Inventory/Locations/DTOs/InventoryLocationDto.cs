using System;

namespace INK.ERP.Application.Features.Inventory.Locations.DTOs;

public record InventoryLocationDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    Guid? BranchId,
    string? BranchName,
    Guid? WarehouseId,
    string? WarehouseName,
    Guid? DepartmentId,
    string? DepartmentName,
    string Code,
    string Name,
    string LocationType,
    bool IsActive,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc);

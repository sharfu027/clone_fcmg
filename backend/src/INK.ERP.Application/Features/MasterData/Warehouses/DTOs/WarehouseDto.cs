namespace INK.ERP.Application.Features.MasterData.Warehouses.DTOs;

public record WarehouseDto(
    Guid Id,
    Guid CompanyId,
    Guid BranchId,
    string Code,
    string Name,
    string WarehouseType,
    Guid? ManagerEmployeeId,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    double? CapacitySqFt,
    bool IsTemperatureControlled,
    bool IsActive,
    DateTime CreatedAtUtc);

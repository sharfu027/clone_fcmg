namespace INK.ERP.Application.Features.MasterData.Branches.DTOs;

public record BranchDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Code,
    string Name,
    string Gstin,
    string Email,
    string Phone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsHeadquarters,
    bool IsActive,
    DateTime CreatedAtUtc);

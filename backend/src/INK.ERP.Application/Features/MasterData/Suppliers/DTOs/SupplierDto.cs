namespace INK.ERP.Application.Features.MasterData.Suppliers.DTOs;

public record SupplierDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Code,
    string LegalName,
    string? TradeName,
    string Gstin,
    string Pan,
    string Email,
    string Phone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    int PaymentTermsDays,
    decimal? CreditLimit,
    bool IsActive,
    DateTime CreatedAtUtc);

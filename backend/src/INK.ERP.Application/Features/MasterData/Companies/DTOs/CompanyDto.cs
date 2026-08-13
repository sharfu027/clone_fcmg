using System;
using INK.ERP.Domain.Enums.MasterData;

namespace INK.ERP.Application.Features.MasterData.Companies.DTOs;

public record CompanyDto(
    Guid Id,
    Guid? TenantId,
    string Code,
    string LegalName,
    string? TradeName,
    string TaxRegistrationNumber,
    string PanNumber,
    string? CinNumber,
    string Email,
    string Phone,
    string? Website,
    string? LogoUrl,
    Guid? CurrencyId,
    string CurrencyCode,
    int FinancialYearStartMonth,
    string TimeZoneId,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    Guid? CountryId,
    CompanyStatus Status,
    bool IsActive,
    uint RowVersion,
    DateTime CreatedAtUtc,
    string? CreatedBy,
    DateTime? LastModifiedAtUtc,
    string? LastModifiedBy);

public record CompanyLookupDto(
    Guid Id,
    string Code,
    string LegalName,
    string CurrencyCode);

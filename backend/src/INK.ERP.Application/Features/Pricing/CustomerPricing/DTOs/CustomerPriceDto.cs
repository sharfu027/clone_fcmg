using System;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.CustomerPricing.DTOs;

public record CustomerPriceDto(
    Guid Id,
    Guid CompanyId,
    Guid CustomerId,
    string CustomerCode,
    string CustomerName,
    Guid PriceListId,
    string PriceListName,
    Guid ProductId,
    string ProductCode,
    string ProductName,
    string Uom,
    decimal BasePrice,
    decimal CustomerPriceValue,
    decimal MinAllowedPrice,
    string CurrencyCode,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    CustomerPriceStatus Status,
    bool IsActive,
    DateTime CreatedAtUtc,
    string CreatedBy,
    DateTime? LastModifiedAtUtc,
    string? LastModifiedBy,
    string? ActivatedBy,
    DateTime? ActivatedAtUtc,
    string? DeactivatedBy,
    DateTime? DeactivatedAtUtc,
    string? ArchivedBy,
    DateTime? ArchivedAtUtc
);

public record CreateCustomerPriceDto(
    Guid CompanyId,
    Guid CustomerId,
    Guid PriceListId,
    Guid ProductId,
    decimal CustomerPriceValue,
    string CurrencyCode,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    CustomerPriceStatus Status
);

public record UpdateCustomerPriceDto(
    decimal CustomerPriceValue,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    CustomerPriceStatus Status
);

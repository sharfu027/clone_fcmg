namespace INK.ERP.Application.Features.Pricing.PriceLists.DTOs;

public record PriceListItemDto(
    Guid Id,
    Guid PriceListId,
    Guid ProductId,
    string? ProductCode,
    string? ProductName,
    decimal BasePrice,
    decimal Msrp,
    decimal MinSellingPrice,
    string CurrencyCode,
    DateTime EffectiveDate,
    bool IsActive);

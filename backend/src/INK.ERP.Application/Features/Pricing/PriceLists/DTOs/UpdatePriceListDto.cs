namespace INK.ERP.Application.Features.Pricing.PriceLists.DTOs;

public record UpdatePriceListDto(
    Guid Id,
    Guid CompanyId,
    string Name,
    string? Description,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    string ConcurrencyToken,
    List<PriceListItemDto> Items);

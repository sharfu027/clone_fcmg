namespace INK.ERP.Application.Features.Pricing.PriceLists.DTOs;

public record CreatePriceListDto(
    Guid CompanyId,
    string Name,
    string? Description,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    List<PriceListItemDto> Items);

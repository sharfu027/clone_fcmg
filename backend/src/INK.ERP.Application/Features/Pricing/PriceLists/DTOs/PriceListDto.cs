namespace INK.ERP.Application.Features.Pricing.PriceLists.DTOs;

public record PriceListDto(
    Guid Id,
    Guid CompanyId,
    string Name,
    string? Description,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    string Status,
    int Version,
    string ConcurrencyToken,
    bool IsDeleted,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc,
    IReadOnlyList<PriceListItemDto> Items);

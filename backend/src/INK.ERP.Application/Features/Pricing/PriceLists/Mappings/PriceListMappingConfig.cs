using Mapster;
using INK.ERP.Domain.Entities.Pricing;
using INK.ERP.Application.Features.Pricing.PriceLists.DTOs;

namespace INK.ERP.Application.Features.Pricing.PriceLists.Mappings;

public sealed class PriceListMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<PriceList, PriceListDto>()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.CompanyId, src => src.CompanyId)
            .Map(dest => dest.Name, src => src.Name)
            .Map(dest => dest.Description, src => src.Description)
            .Map(dest => dest.EffectiveFrom, src => src.EffectiveFrom)
            .Map(dest => dest.EffectiveTo, src => src.EffectiveTo)
            .Map(dest => dest.Status, src => src.Status.ToString())
            .Map(dest => dest.Version, src => src.Version)
            .Map(dest => dest.ConcurrencyToken, src => src.ConcurrencyToken)
            .Map(dest => dest.IsDeleted, src => src.IsDeleted)
            .Map(dest => dest.CreatedAtUtc, src => src.CreatedAtUtc)
            .Map(dest => dest.LastModifiedAtUtc, src => src.LastModifiedAtUtc)
            .Map(dest => dest.Items, src => src.Items);

        config.NewConfig<PriceListItem, PriceListItemDto>()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.PriceListId, src => src.PriceListId)
            .Map(dest => dest.ProductId, src => src.ProductId)
            .Map(dest => dest.BasePrice, src => src.Price)
            .Map(dest => dest.Msrp, src => src.Price)
            .Map(dest => dest.MinSellingPrice, src => src.Price)
            .Map(dest => dest.CurrencyCode, src => src.CurrencyCode)
            .Map(dest => dest.EffectiveDate, src => src.EffectiveDate)
            .Map(dest => dest.IsActive, src => src.IsActive);
    }
}

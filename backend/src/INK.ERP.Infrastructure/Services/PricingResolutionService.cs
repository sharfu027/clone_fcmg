using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Pricing;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Services;

public class PricingResolutionService : IPricingResolutionService
{
    private readonly AppDbContext _dbContext;
    private readonly ICustomerPriceRepository _customerPriceRepository;

    public PricingResolutionService(
        AppDbContext dbContext,
        ICustomerPriceRepository customerPriceRepository)
    {
        _dbContext = dbContext;
        _customerPriceRepository = customerPriceRepository;
    }

    public async Task<PriceResolutionResultDto> ResolvePriceAsync(
        Guid companyId,
        Guid? customerId,
        Guid productId,
        DateTime? targetDate = null,
        CancellationToken cancellationToken = default)
    {
        DateTime effectiveTargetDate = targetDate ?? DateTime.UtcNow;

        // 1. TIER 1: Check for Active Customer Price Override
        if (customerId.HasValue && customerId.Value != Guid.Empty)
        {
            var activeCustomerPrice = await _customerPriceRepository.GetActivePriceForResolutionAsync(
                companyId, customerId.Value, productId, effectiveTargetDate, cancellationToken);

            if (activeCustomerPrice != null)
            {
                return new PriceResolutionResultDto(
                    ResolvedPrice: activeCustomerPrice.CustomerPriceValue,
                    Currency: activeCustomerPrice.CurrencyCode ?? "INR",
                    Source: "CustomerPrice",
                    PriceListId: activeCustomerPrice.PriceListId,
                    CustomerPriceId: activeCustomerPrice.Id,
                    EffectiveDate: activeCustomerPrice.EffectiveFrom,
                    MinimumAllowedPrice: activeCustomerPrice.MinAllowedPrice,
                    PriceListName: activeCustomerPrice.PriceList?.Name,
                    CustomerName: activeCustomerPrice.Customer?.TradeName ?? activeCustomerPrice.Customer?.LegalName,
                    ProductName: activeCustomerPrice.Product?.Name
                );
            }
        }

        // 2. TIER 2: Check for Published Price List Item
        var publishedPriceListItem = await _dbContext.PriceListItems
            .Include(pli => pli.PriceList)
            .Where(pli => pli.ProductId == productId
                       && pli.IsActive
                       && !pli.IsDeleted
                       && pli.PriceList != null
                       && pli.PriceList.CompanyId == companyId
                       && pli.PriceList.Status == PriceListStatus.Published
                       && !pli.PriceList.IsDeleted
                       && pli.PriceList.EffectiveFrom <= effectiveTargetDate
                       && (!pli.PriceList.EffectiveTo.HasValue || pli.PriceList.EffectiveTo.Value >= effectiveTargetDate))
            .OrderByDescending(pli => pli.PriceList!.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);

        if (publishedPriceListItem != null)
        {
            var pliProduct = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
            return new PriceResolutionResultDto(
                ResolvedPrice: publishedPriceListItem.Price,
                Currency: publishedPriceListItem.CurrencyCode ?? "INR",
                Source: "PublishedPriceList",
                PriceListId: publishedPriceListItem.PriceListId,
                CustomerPriceId: null,
                EffectiveDate: publishedPriceListItem.PriceList?.EffectiveFrom ?? effectiveTargetDate,
                MinimumAllowedPrice: publishedPriceListItem.Price,
                PriceListName: publishedPriceListItem.PriceList?.Name,
                CustomerName: null,
                ProductName: pliProduct?.Name
            );
        }

        // 3. TIER 3: Fallback to Master Product Base Price
        var product = await _dbContext.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.IsActive, cancellationToken);

        if (product != null)
        {
            return new PriceResolutionResultDto(
                ResolvedPrice: product.BasePrice,
                Currency: "INR",
                Source: "ProductBasePrice",
                PriceListId: null,
                CustomerPriceId: null,
                EffectiveDate: effectiveTargetDate,
                MinimumAllowedPrice: product.BasePrice,
                PriceListName: null,
                CustomerName: null,
                ProductName: product.Name
            );
        }

        // Fallback default
        return new PriceResolutionResultDto(
            ResolvedPrice: 0,
            Currency: "INR",
            Source: "None",
            PriceListId: null,
            CustomerPriceId: null,
            EffectiveDate: effectiveTargetDate,
            MinimumAllowedPrice: 0,
            PriceListName: null,
            CustomerName: null,
            ProductName: null
        );
    }
}

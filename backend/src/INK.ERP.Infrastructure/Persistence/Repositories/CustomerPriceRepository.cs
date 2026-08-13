using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Pricing;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class CustomerPriceRepository : GenericRepository<CustomerPrice>, ICustomerPriceRepository
{
    private readonly AppDbContext _dbContext;

    public CustomerPriceRepository(AppDbContext context) : base(context)
    {
        _dbContext = context;
    }

    public async Task<CustomerPrice?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.CustomerPrices
            .Include(c => c.Customer)
            .Include(c => c.Product)
            .Include(c => c.PriceList)
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken);
    }

    public async Task<(IReadOnlyList<CustomerPrice> Items, int TotalCount)> GetPagedAsync(
        Guid companyId,
        Guid? customerId,
        Guid? productId,
        Guid? priceListId,
        CustomerPriceStatus? status,
        string? currency,
        DateTime? effectiveDate,
        string? search,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.CustomerPrices
            .Include(c => c.Customer)
            .Include(c => c.Product)
            .Include(c => c.PriceList)
            .Where(c => c.CompanyId == companyId && !c.IsDeleted)
            .AsNoTracking();

        if (customerId.HasValue)
            query = query.Where(c => c.CustomerId == customerId.Value);

        if (productId.HasValue)
            query = query.Where(c => c.ProductId == productId.Value);

        if (priceListId.HasValue)
            query = query.Where(c => c.PriceListId == priceListId.Value);

        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(currency))
            query = query.Where(c => c.CurrencyCode == currency);

        if (effectiveDate.HasValue)
        {
            var date = effectiveDate.Value;
            query = query.Where(c => c.EffectiveFrom <= date && (!c.EffectiveTo.HasValue || c.EffectiveTo.Value >= date));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => (c.Customer != null && (c.Customer.LegalName.ToLower().Contains(s) || (c.Customer.TradeName != null && c.Customer.TradeName.ToLower().Contains(s)) || c.Customer.Code.ToLower().Contains(s)))
                                  || (c.Product != null && (c.Product.Name.ToLower().Contains(s) || c.Product.Code.ToLower().Contains(s) || (c.Product.Sku != null && c.Product.Sku.ToLower().Contains(s))))
                                  || (c.PriceList != null && c.PriceList.Name.ToLower().Contains(s)));
        }

        int totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<bool> HasOverlappingActivePriceAsync(
        Guid companyId,
        Guid customerId,
        Guid productId,
        Guid priceListId,
        DateTime effectiveFrom,
        DateTime? effectiveTo,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.CustomerPrices
            .Where(c => c.CompanyId == companyId
                     && c.CustomerId == customerId
                     && c.ProductId == productId
                     && c.Status == CustomerPriceStatus.Active
                     && c.IsActive
                     && !c.IsDeleted);

        if (excludeId.HasValue)
        {
            query = query.Where(c => c.Id != excludeId.Value);
        }

        var activePrices = await query.ToListAsync(cancellationToken);

        foreach (var price in activePrices)
        {
            DateTime start = price.EffectiveFrom;
            DateTime? end = price.EffectiveTo;

            bool startValid = !effectiveTo.HasValue || start <= effectiveTo.Value;
            bool endValid = !end.HasValue || end.Value >= effectiveFrom;

            if (startValid && endValid)
            {
                return true;
            }
        }

        return false;
    }

    public async Task<CustomerPrice?> GetActivePriceForResolutionAsync(
        Guid companyId,
        Guid customerId,
        Guid productId,
        DateTime targetDate,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.CustomerPrices
            .Include(c => c.Customer)
            .Include(c => c.Product)
            .Include(c => c.PriceList)
            .Where(c => c.CompanyId == companyId
                     && c.CustomerId == customerId
                     && c.ProductId == productId
                     && c.Status == CustomerPriceStatus.Active
                     && c.IsActive
                     && !c.IsDeleted
                     && c.EffectiveFrom <= targetDate
                     && (!c.EffectiveTo.HasValue || c.EffectiveTo.Value >= targetDate)
                     && c.PriceList != null
                     && c.PriceList.Status == PriceListStatus.Published)
            .OrderByDescending(c => c.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);
    }
}

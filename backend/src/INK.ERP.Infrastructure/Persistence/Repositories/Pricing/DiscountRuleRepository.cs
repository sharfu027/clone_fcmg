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

public class DiscountRuleRepository : GenericRepository<DiscountRule>, IDiscountRuleRepository
{
    private readonly AppDbContext _dbContext;

    public DiscountRuleRepository(AppDbContext context) : base(context)
    {
        _dbContext = context;
    }

    public async Task<DiscountRule?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.DiscountRules
            .Include(d => d.Customer)
            .Include(d => d.Product)
            .Include(d => d.PriceList)
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, cancellationToken);
    }

    public async Task<(IReadOnlyList<DiscountRule> Items, int TotalCount)> GetPagedAsync(
        Guid? companyId,
        DiscountScope? scope,
        DiscountMethod? method,
        DiscountRuleStatus? status,
        DateTime? effectiveDate,
        string? search,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.DiscountRules
            .Include(d => d.Customer)
            .Include(d => d.Product)
            .Include(d => d.PriceList)
            .Where(d => !d.IsDeleted);

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(d => d.CompanyId == companyId.Value);

        if (scope.HasValue)
            query = query.Where(d => d.Scope == scope.Value);

        if (method.HasValue)
            query = query.Where(d => d.DiscountMethod == method.Value);

        if (status.HasValue)
            query = query.Where(d => d.Status == status.Value);

        if (effectiveDate.HasValue)
        {
            var date = effectiveDate.Value.ToUniversalTime();
            query = query.Where(d => d.EffectiveFrom <= date && (d.EffectiveTo == null || d.EffectiveTo >= date));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(d =>
                d.RuleCode.ToLower().Contains(s) ||
                d.RuleName.ToLower().Contains(s) ||
                (d.Description != null && d.Description.ToLower().Contains(s)) ||
                (d.Customer != null && (d.Customer.LegalName.ToLower().Contains(s) || d.Customer.Code.ToLower().Contains(s))) ||
                (d.Product != null && (d.Product.Name.ToLower().Contains(s) || d.Product.Code.ToLower().Contains(s))));
        }

        int totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(d => d.Priority)
            .ThenByDescending(d => d.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<DiscountRule>> GetApplicableActiveRulesAsync(
        Guid companyId,
        DateTime targetDate,
        CancellationToken cancellationToken = default)
    {
        var date = targetDate.ToUniversalTime();
        return await _dbContext.DiscountRules
            .Where(d => !d.IsDeleted &&
                        d.CompanyId == companyId &&
                        d.IsActive &&
                        d.Status == DiscountRuleStatus.Active &&
                        d.EffectiveFrom <= date &&
                        (d.EffectiveTo == null || d.EffectiveTo >= date))
            .OrderBy(d => (int)d.Scope)
            .ThenByDescending(d => d.Priority)
            .ToListAsync(cancellationToken);
    }
}

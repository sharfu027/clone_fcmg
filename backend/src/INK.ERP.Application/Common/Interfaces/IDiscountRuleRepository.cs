using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Common.Interfaces;

public interface IDiscountRuleRepository : IGenericRepository<DiscountRule>
{
    Task<DiscountRule?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<DiscountRule> Items, int TotalCount)> GetPagedAsync(
        Guid? companyId,
        DiscountScope? scope,
        DiscountMethod? method,
        DiscountRuleStatus? status,
        DateTime? effectiveDate,
        string? search,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DiscountRule>> GetApplicableActiveRulesAsync(
        Guid companyId,
        DateTime targetDate,
        CancellationToken cancellationToken = default);
}

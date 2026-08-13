using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Application.Common.Models;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Common.Interfaces;

public interface ICustomerPriceRepository : IGenericRepository<CustomerPrice>
{
    Task<CustomerPrice?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<CustomerPrice> Items, int TotalCount)> GetPagedAsync(
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
        CancellationToken cancellationToken = default);

    Task<bool> HasOverlappingActivePriceAsync(
        Guid companyId,
        Guid customerId,
        Guid productId,
        Guid priceListId,
        DateTime effectiveFrom,
        DateTime? effectiveTo,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    Task<CustomerPrice?> GetActivePriceForResolutionAsync(
        Guid companyId,
        Guid customerId,
        Guid productId,
        DateTime targetDate,
        CancellationToken cancellationToken = default);
}

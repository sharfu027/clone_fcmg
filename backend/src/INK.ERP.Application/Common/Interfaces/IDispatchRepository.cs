using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Application.Common.Interfaces;

public interface IDispatchRepository
{
    Task<Dispatch?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Dispatch?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Dispatch?> GetByOrderAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Dispatch>> ListAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? packTaskId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);
    Task<int> CountAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? packTaskId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);
    Task<string> GetNextDispatchNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task AddAsync(Dispatch dispatch, CancellationToken cancellationToken = default);
    Task UpdateAsync(Dispatch dispatch, CancellationToken cancellationToken = default);
}

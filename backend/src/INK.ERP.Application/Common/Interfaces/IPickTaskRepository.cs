using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Application.Common.Interfaces;

public interface IPickTaskRepository
{
    Task<PickTask?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PickTask?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PickTask?> GetByOrderAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PickTask>> ListAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? locationId = null,
        Guid? employeeId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);
    Task<int> CountAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? locationId = null,
        Guid? employeeId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);
    Task<string> GetNextPickTaskNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task AddAsync(PickTask pickTask, CancellationToken cancellationToken = default);
    Task UpdateAsync(PickTask pickTask, CancellationToken cancellationToken = default);
}

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Application.Common.Interfaces;

public interface IPackTaskRepository
{
    Task<PackTask?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PackTask?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PackTask?> GetByOrderAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default);
    Task<PackTask?> GetByPickTaskIdAsync(Guid companyId, Guid pickTaskId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PackTask>> ListAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? pickTaskId = null,
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
        Guid? pickTaskId = null,
        Guid? employeeId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);
    Task<string> GetNextPackTaskNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<string> GetNextPackageNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task AddAsync(PackTask packTask, CancellationToken cancellationToken = default);
    Task AddPackageAsync(Package package, CancellationToken cancellationToken = default);
    Task UpdateAsync(PackTask packTask, CancellationToken cancellationToken = default);
}

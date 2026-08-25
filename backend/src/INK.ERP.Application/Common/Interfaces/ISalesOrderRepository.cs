using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Common.Interfaces;

public interface ISalesOrderRepository
{
    Task<SalesOrder?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SalesOrder?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SalesOrder>> ListAsync(
        Guid? companyId = null,
        Guid? customerId = null,
        Guid? salesEmployeeId = null,
        string? status = null,
        string? search = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);
    Task<string> GetNextOrderNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<bool> OrderNumberExistsAsync(Guid companyId, string orderNumber, CancellationToken cancellationToken = default);
    Task AddAsync(SalesOrder order, CancellationToken cancellationToken = default);
    Task UpdateAsync(SalesOrder order, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

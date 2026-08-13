using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.Application.Common.Interfaces;

public interface IRfqRepository : IGenericRepository<Rfq>
{
    Task<string> GenerateNextRfqNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<Rfq?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Rfq>> GetByPurchaseRequisitionIdAsync(Guid purchaseRequisitionId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Rfq> Items, int TotalCount)> GetPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        string? search,
        RfqStatus? status,
        Guid? supplierId,
        Guid? purchaseRequisitionId,
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default);
    Task<(int Total, int Draft, int Submitted, int Sent, int Closed, int Cancelled)> GetRfqMetricsAsync(Guid companyId, CancellationToken cancellationToken = default);
}

using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.Application.Common.Interfaces;

public interface IPurchaseRequisitionRepository : IGenericRepository<PurchaseRequisition>
{
    Task<string> GenerateNextRequisitionNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<PurchaseRequisition?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<PurchaseRequisition> Items, int TotalCount)> GetPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        string? search,
        RequisitionStatus? status,
        RequisitionPriority? priority,
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default);
}

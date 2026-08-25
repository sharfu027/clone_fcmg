using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Common.Interfaces;

public interface IStockTransferRepository
{
    Task<StockTransfer?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StockTransfer?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StockTransfer>> ListAsync(
        Guid? companyId = null,
        Guid? sourceLocationId = null,
        Guid? destinationLocationId = null,
        Guid? salesOrderId = null,
        string? status = null,
        string? search = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);
    Task<string> GetNextTransferNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task AddAsync(StockTransfer transfer, CancellationToken cancellationToken = default);
    Task UpdateAsync(StockTransfer transfer, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

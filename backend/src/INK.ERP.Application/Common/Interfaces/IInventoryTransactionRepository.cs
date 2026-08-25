using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Common.Interfaces;

public interface IInventoryTransactionRepository : IGenericRepository<InventoryTransaction>
{
    Task<IReadOnlyList<InventoryTransaction>> GetByBalanceContextAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryTransaction>> GetByReferenceDocumentAsync(Guid companyId, string referenceDocumentType, Guid referenceDocumentId, CancellationToken cancellationToken = default);
    Task<InventoryTransaction?> GetLatestAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default);
    Task<bool> HasOpeningBalanceAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default);
}

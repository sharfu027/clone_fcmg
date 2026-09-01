using System;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Common.Interfaces;

public interface IInventoryBalanceRepository : IGenericRepository<InventoryBalance>
{
    Task<InventoryBalance?> GetByLocationProductAndBatchAsync(Guid companyId, Guid inventoryLocationId, Guid productId, string? batchNumber, CancellationToken cancellationToken = default);
    Task<InventoryBalance?> GetByLocationAndProductAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid companyId, Guid inventoryLocationId, Guid productId, string? batchNumber = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryBalance>> GetByLocationAndProductListAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default);
}

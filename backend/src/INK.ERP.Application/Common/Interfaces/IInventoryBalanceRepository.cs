using System;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Common.Interfaces;

public interface IInventoryBalanceRepository : IGenericRepository<InventoryBalance>
{
    Task<InventoryBalance?> GetByLocationAndProductAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default);
}

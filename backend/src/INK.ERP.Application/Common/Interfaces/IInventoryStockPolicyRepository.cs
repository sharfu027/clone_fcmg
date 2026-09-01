using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Common.Interfaces;

public interface IInventoryStockPolicyRepository
{
    Task<InventoryStockPolicy?> GetPolicyAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryStockPolicy>> GetPoliciesByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryStockPolicy>> GetPoliciesByLocationAsync(Guid companyId, Guid inventoryLocationId, CancellationToken cancellationToken = default);
    Task AddAsync(InventoryStockPolicy policy, CancellationToken cancellationToken = default);
    Task UpdateAsync(InventoryStockPolicy policy, CancellationToken cancellationToken = default);
    Task<InventoryStockPolicy> UpsertPolicyAsync(Guid companyId, Guid inventoryLocationId, Guid productId, decimal minStockQuantity, decimal? reorderPoint = null, decimal? reorderQuantity = null, CancellationToken cancellationToken = default);
}

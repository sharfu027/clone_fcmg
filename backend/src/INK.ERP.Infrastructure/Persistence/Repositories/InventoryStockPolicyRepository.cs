using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public sealed class InventoryStockPolicyRepository : GenericRepository<InventoryStockPolicy>, IInventoryStockPolicyRepository
{
    public InventoryStockPolicyRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<InventoryStockPolicy?> GetPolicyAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Product)
            .Include(p => p.InventoryLocation)
            .FirstOrDefaultAsync(p => p.CompanyId == companyId && p.InventoryLocationId == inventoryLocationId && p.ProductId == productId, cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryStockPolicy>> GetPoliciesByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Product)
            .Include(p => p.InventoryLocation)
            .Where(p => p.CompanyId == companyId && p.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryStockPolicy>> GetPoliciesByLocationAsync(Guid companyId, Guid inventoryLocationId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Product)
            .Include(p => p.InventoryLocation)
            .Where(p => p.CompanyId == companyId && p.InventoryLocationId == inventoryLocationId && p.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<InventoryStockPolicy> UpsertPolicyAsync(
        Guid companyId,
        Guid inventoryLocationId,
        Guid productId,
        decimal minStockQuantity,
        decimal? reorderPoint = null,
        decimal? reorderQuantity = null,
        CancellationToken cancellationToken = default)
    {
        var existing = await _dbSet
            .FirstOrDefaultAsync(p => p.CompanyId == companyId && p.InventoryLocationId == inventoryLocationId && p.ProductId == productId, cancellationToken);

        if (existing == null)
        {
            var policy = new InventoryStockPolicy
            {
                CompanyId = companyId,
                InventoryLocationId = inventoryLocationId,
                ProductId = productId,
                MinStockQuantity = Math.Max(0m, minStockQuantity),
                ReorderPoint = reorderPoint,
                ReorderQuantity = reorderQuantity,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            await _dbSet.AddAsync(policy, cancellationToken);
            return policy;
        }

        existing.MinStockQuantity = Math.Max(0m, minStockQuantity);
        if (reorderPoint.HasValue) existing.ReorderPoint = reorderPoint.Value;
        if (reorderQuantity.HasValue) existing.ReorderQuantity = reorderQuantity.Value;
        existing.LastModifiedAtUtc = DateTime.UtcNow;
        _dbSet.Update(existing);
        return existing;
    }
}

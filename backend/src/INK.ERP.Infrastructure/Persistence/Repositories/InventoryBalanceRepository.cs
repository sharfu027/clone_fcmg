using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public sealed class InventoryBalanceRepository : GenericRepository<InventoryBalance>, IInventoryBalanceRepository
{
    public InventoryBalanceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<InventoryBalance?> GetByLocationProductAndBatchAsync(Guid companyId, Guid inventoryLocationId, Guid productId, string? batchNumber, CancellationToken cancellationToken = default)
    {
        string? normalizedBatch = string.IsNullOrWhiteSpace(batchNumber) ? null : batchNumber.Trim().ToUpperInvariant();

        var query = _dbSet
            .Include(b => b.Company)
            .Include(b => b.InventoryLocation)
            .Include(b => b.Product)
                .ThenInclude(p => p!.BaseUom)
            .Where(b => b.CompanyId == companyId && b.InventoryLocationId == inventoryLocationId && b.ProductId == productId);

        if (normalizedBatch == null)
        {
            return await query.FirstOrDefaultAsync(b => b.BatchNumber == null || b.BatchNumber == "", cancellationToken);
        }

        return await query.FirstOrDefaultAsync(b => b.BatchNumber != null && b.BatchNumber.ToUpper() == normalizedBatch, cancellationToken);
    }

    public async Task<InventoryBalance?> GetByLocationAndProductAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await GetByLocationProductAndBatchAsync(companyId, inventoryLocationId, productId, null, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid companyId, Guid inventoryLocationId, Guid productId, string? batchNumber = null, CancellationToken cancellationToken = default)
    {
        string? normalizedBatch = string.IsNullOrWhiteSpace(batchNumber) ? null : batchNumber.Trim().ToUpperInvariant();

        var query = _dbSet.Where(b => b.CompanyId == companyId && b.InventoryLocationId == inventoryLocationId && b.ProductId == productId);

        if (normalizedBatch == null)
        {
            return await query.AnyAsync(b => b.BatchNumber == null || b.BatchNumber == "", cancellationToken);
        }

        return await query.AnyAsync(b => b.BatchNumber != null && b.BatchNumber.ToUpper() == normalizedBatch, cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryBalance>> GetByLocationAndProductListAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.Company)
            .Include(b => b.InventoryLocation)
            .Include(b => b.Product)
                .ThenInclude(p => p!.BaseUom)
            .Where(b => b.CompanyId == companyId && b.InventoryLocationId == inventoryLocationId && b.ProductId == productId)
            .ToListAsync(cancellationToken);
    }
}

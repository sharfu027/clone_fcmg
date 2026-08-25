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

public sealed class InventoryTransactionRepository : GenericRepository<InventoryTransaction>, IInventoryTransactionRepository
{
    public InventoryTransactionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<InventoryTransaction>> GetByBalanceContextAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(t => t.CompanyId == companyId && t.InventoryLocationId == inventoryLocationId && t.ProductId == productId)
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryTransaction>> GetByReferenceDocumentAsync(Guid companyId, string referenceDocumentType, Guid referenceDocumentId, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsQueryable();
        if (companyId != Guid.Empty)
        {
            query = query.Where(t => t.CompanyId == companyId);
        }

        var normalizedType = referenceDocumentType.Trim();
        return await query
            .Where(t => t.ReferenceDocumentType != null &&
                        t.ReferenceDocumentType.ToLower() == normalizedType.ToLower() &&
                        t.ReferenceDocumentId == referenceDocumentId)
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<InventoryTransaction?> GetLatestAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(t => t.CompanyId == companyId && t.InventoryLocationId == inventoryLocationId && t.ProductId == productId)
            .OrderByDescending(t => t.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> HasOpeningBalanceAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(t =>
            t.CompanyId == companyId &&
            t.InventoryLocationId == inventoryLocationId &&
            t.ProductId == productId &&
            t.TransactionType == InventoryTransactionTypes.OpeningBalance,
            cancellationToken);
    }
}

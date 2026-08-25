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

    public async Task<InventoryBalance?> GetByLocationAndProductAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.Company)
            .Include(b => b.InventoryLocation)
            .Include(b => b.Product)
                .ThenInclude(p => p!.BaseUom)
            .FirstOrDefaultAsync(b => b.CompanyId == companyId && b.InventoryLocationId == inventoryLocationId && b.ProductId == productId, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid companyId, Guid inventoryLocationId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(b => b.CompanyId == companyId && b.InventoryLocationId == inventoryLocationId && b.ProductId == productId, cancellationToken);
    }
}

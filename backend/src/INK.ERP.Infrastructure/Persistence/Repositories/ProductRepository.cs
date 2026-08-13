using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class ProductRepository : GenericRepository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Product?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.BaseUom)
            .Include(p => p.Company)
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(p => p.CompanyId == companyId && p.Code == normalizedCode && (!excludeId.HasValue || p.Id != excludeId.Value), cancellationToken);
    }

    public async Task<bool> IsSkuUniqueAsync(Guid companyId, string sku, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedSku = sku.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(p => p.CompanyId == companyId && p.Sku == normalizedSku && (!excludeId.HasValue || p.Id != excludeId.Value), cancellationToken);
    }
}

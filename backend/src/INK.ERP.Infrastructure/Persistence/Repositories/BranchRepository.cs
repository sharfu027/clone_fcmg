using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class BranchRepository : GenericRepository<Branch>, IBranchRepository
{
    public BranchRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(b => b.CompanyId == companyId && b.Code == normalizedCode && (!excludeId.HasValue || b.Id != excludeId.Value), cancellationToken);
    }

    public async Task<Branch?> GetHeadquartersAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(b => b.CompanyId == companyId && b.IsHeadquarters && !b.IsDeleted, cancellationToken);
    }
}

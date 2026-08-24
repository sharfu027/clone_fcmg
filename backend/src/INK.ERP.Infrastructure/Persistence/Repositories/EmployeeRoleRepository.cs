using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class EmployeeRoleRepository : GenericRepository<EmployeeRole>, IEmployeeRoleRepository
{
    public EmployeeRoleRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(r => r.CompanyId == companyId && r.Code == normalizedCode && (!excludeId.HasValue || r.Id != excludeId.Value), cancellationToken);
    }

    public async Task<EmployeeRole?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Company)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<EmployeeRole>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Company)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}

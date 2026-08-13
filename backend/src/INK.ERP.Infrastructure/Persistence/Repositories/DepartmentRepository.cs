using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class DepartmentRepository : GenericRepository<Department>, IDepartmentRepository
{
    public DepartmentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> IsCodeUniqueAsync(Guid branchId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(d => d.BranchId == branchId && d.Code == normalizedCode && (!excludeId.HasValue || d.Id != excludeId.Value), cancellationToken);
    }
}

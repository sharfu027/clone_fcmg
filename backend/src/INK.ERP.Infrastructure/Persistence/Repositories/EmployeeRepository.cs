using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class EmployeeRepository : GenericRepository<Employee>, IEmployeeRepository
{
    public EmployeeRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> IsEmployeeCodeUniqueAsync(Guid companyId, string employeeCode, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedCode = employeeCode.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(e => e.CompanyId == companyId && e.EmployeeCode == normalizedCode && (!excludeId.HasValue || e.Id != excludeId.Value), cancellationToken);
    }

    public async Task<bool> IsEmailUniqueAsync(string email, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.ToLowerInvariant().Trim();
        return !await _dbSet.AnyAsync(e => e.Email == normalizedEmail && (!excludeId.HasValue || e.Id != excludeId.Value), cancellationToken);
    }

    public async Task<Employee?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.EmployeeRole)
            .Include(e => e.Warehouse)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Employee>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.EmployeeRole)
            .Include(e => e.Warehouse)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}

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
}

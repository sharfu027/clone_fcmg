using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Pricing;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class PriceListRepository : GenericRepository<PriceList>, IPriceListRepository
{
    public PriceListRepository(AppDbContext context) : base(context) { }

    public async Task<bool> IsNameUniqueAsync(Guid companyId, string name, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = name.Trim();
        return !await _dbSet.AnyAsync(pl => pl.CompanyId == companyId && pl.Name == normalized && (!excludeId.HasValue || pl.Id != excludeId.Value), cancellationToken);
    }
}

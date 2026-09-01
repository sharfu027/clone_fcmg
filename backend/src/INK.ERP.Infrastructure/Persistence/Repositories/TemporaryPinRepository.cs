using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public sealed class TemporaryPinRepository : GenericRepository<TemporaryAuthorizationPin>, ITemporaryPinRepository
{
    public TemporaryPinRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<TemporaryAuthorizationPin?> GetActivePinByHashAsync(Guid companyId, string pinHash, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _context.TemporaryAuthorizationPins
            .Include(x => x.Company)
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x =>
                x.CompanyId == companyId &&
                x.PinHash == pinHash &&
                !x.IsUsed &&
                x.ExpiresAtUtc > now, cancellationToken);
    }

    public async Task<IReadOnlyList<TemporaryAuthorizationPin>> ListRecentAsync(Guid companyId, int limit = 20, CancellationToken cancellationToken = default)
    {
        return await _context.TemporaryAuthorizationPins
            .Include(x => x.Company)
            .Include(x => x.Employee)
            .Where(x => x.CompanyId == companyId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }
}

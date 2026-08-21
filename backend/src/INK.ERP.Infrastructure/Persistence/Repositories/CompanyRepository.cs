using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class CompanyRepository : GenericRepository<Company>, ICompanyRepository
{
    private readonly AppDbContext _dbContext;

    public CompanyRepository(AppDbContext dbContext) : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> ExistsCodeAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = code.Trim().ToUpperInvariant();
        return await _dbContext.Companies.IgnoreQueryFilters()
            .AnyAsync(c => c.Code.ToUpper() == normalized && (!excludeId.HasValue || c.Id != excludeId.Value), cancellationToken);
    }

    public async Task<bool> ExistsGstinAsync(string gstin, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = gstin.Trim().ToUpperInvariant();
        return await _dbContext.Companies.IgnoreQueryFilters()
            .AnyAsync(c => c.TaxRegistrationNumber.ToUpper() == normalized && (!excludeId.HasValue || c.Id != excludeId.Value), cancellationToken);
    }

    public async Task<bool> ExistsLegalNameAsync(string legalName, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = legalName.Trim().ToLowerInvariant();
        return await _dbContext.Companies.IgnoreQueryFilters()
            .AnyAsync(c => c.LegalName.ToLower() == normalized && (!excludeId.HasValue || c.Id != excludeId.Value), cancellationToken);
    }

    public async Task<string> GetNextCompanyCodeAsync(CancellationToken cancellationToken = default)
    {
        var existingCodes = await _dbContext.Companies
            .IgnoreQueryFilters()
            .Select(c => c.Code.ToUpper())
            .ToListAsync(cancellationToken);

        var codeSet = new System.Collections.Generic.HashSet<string>(existingCodes);
        int counter = 1;
        while (counter < 10000)
        {
            var candidate = $"COM-{counter:D3}";
            if (!codeSet.Contains(candidate))
            {
                return candidate;
            }
            counter++;
        }
        return $"COM-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
    }
}

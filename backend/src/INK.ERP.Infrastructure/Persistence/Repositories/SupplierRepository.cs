using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class SupplierRepository : GenericRepository<Supplier>, ISupplierRepository
{
    public SupplierRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(s => s.CompanyId == companyId && s.Code == normalizedCode && (!excludeId.HasValue || s.Id != excludeId.Value), cancellationToken);
    }

    public async Task<bool> IsGstinUniqueAsync(Guid companyId, string gstin, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedGstin = gstin.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(s => s.CompanyId == companyId && s.Gstin == normalizedGstin && (!excludeId.HasValue || s.Id != excludeId.Value), cancellationToken);
    }

    public async Task<string> GenerateNextCodeAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var existingCodes = await _dbSet
            .Where(s => s.CompanyId == companyId && s.Code.StartsWith("SUP-"))
            .Select(s => s.Code)
            .ToListAsync(cancellationToken);

        int maxNumber = 0;
        foreach (var code in existingCodes)
        {
            if (code.Length > 4)
            {
                var numPart = code.Substring(4); // After "SUP-"
                if (int.TryParse(numPart, out int num))
                {
                    if (num > maxNumber) maxNumber = num;
                }
            }
        }

        int nextNumber = maxNumber + 1;
        var candidateCode = $"SUP-{nextNumber:D6}";

        // Ensure absolute uniqueness against any potential race condition
        while (await _dbSet.AnyAsync(s => s.CompanyId == companyId && s.Code == candidateCode, cancellationToken))
        {
            nextNumber++;
            candidateCode = $"SUP-{nextNumber:D6}";
        }

        return candidateCode;
    }

    public async Task<Supplier?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(s => s.Company)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Supplier>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(s => s.Company)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}

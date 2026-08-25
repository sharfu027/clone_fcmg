using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public sealed class InventoryLocationRepository : GenericRepository<InventoryLocation>, IInventoryLocationRepository
{
    public InventoryLocationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.ToUpperInvariant().Trim();
        return !await _dbSet.AnyAsync(l => l.CompanyId == companyId && l.Code == normalizedCode && (!excludeId.HasValue || l.Id != excludeId.Value), cancellationToken);
    }

    public async Task<string> GenerateNextCodeAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var existingCodes = await _dbSet
            .Where(l => l.CompanyId == companyId)
            .Select(l => l.Code)
            .ToListAsync(cancellationToken);

        int maxNumber = 0;
        foreach (var code in existingCodes)
        {
            if (string.IsNullOrWhiteSpace(code)) continue;

            if (code.StartsWith("LOC-", StringComparison.OrdinalIgnoreCase) && code.Length > 4)
            {
                var numPart = code.Substring(4);
                if (int.TryParse(numPart, out int num))
                {
                    if (num > maxNumber) maxNumber = num;
                }
            }
            else if (int.TryParse(code, out int directNum))
            {
                if (directNum > maxNumber) maxNumber = directNum;
            }
        }

        int candidateNumber = Math.Max(1, maxNumber + 1);
        string candidateCode = $"LOC-{candidateNumber:D3}";

        // Ensure collision safety: if candidate already exists in database, increment until unique
        while (existingCodes.Any(c => string.Equals(c, candidateCode, StringComparison.OrdinalIgnoreCase)))
        {
            candidateNumber++;
            candidateCode = $"LOC-{candidateNumber:D3}";
        }

        return candidateCode;
    }
}

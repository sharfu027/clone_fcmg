using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Procurement;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class PurchaseRequisitionRepository : GenericRepository<PurchaseRequisition>, IPurchaseRequisitionRepository
{
    public PurchaseRequisitionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<string> GenerateNextRequisitionNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"PR-{year}-";

        var existingNumbers = await _dbSet
            .Where(r => r.CompanyId == companyId && r.RequisitionNumber.StartsWith(prefix))
            .Select(r => r.RequisitionNumber)
            .ToListAsync(cancellationToken);

        int maxNumber = 0;
        foreach (var numStr in existingNumbers)
        {
            if (numStr.Length > prefix.Length)
            {
                var numPart = numStr.Substring(prefix.Length);
                if (int.TryParse(numPart, out int parsed))
                {
                    if (parsed > maxNumber) maxNumber = parsed;
                }
            }
        }

        int nextNumber = maxNumber + 1;
        var candidate = $"{prefix}{nextNumber:D6}";

        while (await _dbSet.AnyAsync(r => r.CompanyId == companyId && r.RequisitionNumber == candidate, cancellationToken))
        {
            nextNumber++;
            candidate = $"{prefix}{nextNumber:D6}";
        }

        return candidate;
    }

    public async Task<PurchaseRequisition?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Items)
            .Include(r => r.StatusHistories)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, cancellationToken);
    }

    public async Task<(IReadOnlyList<PurchaseRequisition> Items, int TotalCount)> GetPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        string? search,
        RequisitionStatus? status,
        RequisitionPriority? priority,
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Where(r => r.CompanyId == companyId && !r.IsDeleted)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim().ToLower();
            query = query.Where(r =>
                r.RequisitionNumber.ToLower().Contains(cleanSearch) ||
                r.RequestedByName.ToLower().Contains(cleanSearch) ||
                (r.DepartmentName != null && r.DepartmentName.ToLower().Contains(cleanSearch)) ||
                r.Purpose.ToLower().Contains(cleanSearch));
        }

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        if (priority.HasValue)
        {
            query = query.Where(r => r.Priority == priority.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(r => r.RequestDate >= fromDate.Value.ToUniversalTime());
        }

        if (toDate.HasValue)
        {
            query = query.Where(r => r.RequestDate <= toDate.Value.ToUniversalTime());
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(r => r.Items)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}

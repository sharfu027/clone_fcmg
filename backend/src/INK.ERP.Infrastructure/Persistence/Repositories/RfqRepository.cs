using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Procurement;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class RfqRepository : GenericRepository<Rfq>, IRfqRepository
{
    public RfqRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<string> GenerateNextRfqNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"RFQ-{year}-";

        var existingNumbers = await _dbSet
            .Where(r => r.CompanyId == companyId && r.RfqNumber.StartsWith(prefix))
            .Select(r => r.RfqNumber)
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

        while (await _dbSet.AnyAsync(r => r.CompanyId == companyId && r.RfqNumber == candidate, cancellationToken))
        {
            nextNumber++;
            candidate = $"{prefix}{nextNumber:D6}";
        }

        return candidate;
    }

    public async Task<Rfq?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Items)
            .Include(r => r.Suppliers)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, cancellationToken);
    }

    public async Task<IReadOnlyList<Rfq>> GetByPurchaseRequisitionIdAsync(Guid purchaseRequisitionId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.PurchaseRequisitionId == purchaseRequisitionId && !r.IsDeleted)
            .Include(r => r.Items)
            .Include(r => r.Suppliers)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<Rfq> Items, int TotalCount)> GetPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        string? search,
        RfqStatus? status,
        Guid? supplierId,
        Guid? purchaseRequisitionId,
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
                r.RfqNumber.ToLower().Contains(cleanSearch) ||
                r.PurchaseRequisitionNumber.ToLower().Contains(cleanSearch) ||
                r.RequestedByName.ToLower().Contains(cleanSearch) ||
                (r.DepartmentName != null && r.DepartmentName.ToLower().Contains(cleanSearch)) ||
                r.Suppliers.Any(s => s.SupplierName.ToLower().Contains(cleanSearch) || s.SupplierCode.ToLower().Contains(cleanSearch)));
        }

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        if (supplierId.HasValue)
        {
            query = query.Where(r => r.Suppliers.Any(s => s.SupplierId == supplierId.Value));
        }

        if (purchaseRequisitionId.HasValue)
        {
            query = query.Where(r => r.PurchaseRequisitionId == purchaseRequisitionId.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(r => r.RfqDate >= fromDate.Value.ToUniversalTime());
        }

        if (toDate.HasValue)
        {
            query = query.Where(r => r.RfqDate <= toDate.Value.ToUniversalTime());
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(r => r.Items)
            .Include(r => r.Suppliers)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(int Total, int Draft, int Submitted, int Sent, int Closed, int Cancelled)> GetRfqMetricsAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var stats = await _dbSet
            .Where(r => r.CompanyId == companyId && !r.IsDeleted)
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int total = stats.Sum(s => s.Count);
        int draft = stats.FirstOrDefault(s => s.Status == RfqStatus.Draft)?.Count ?? 0;
        int submitted = stats.FirstOrDefault(s => s.Status == RfqStatus.Submitted)?.Count ?? 0;
        int sent = stats.FirstOrDefault(s => s.Status == RfqStatus.Sent)?.Count ?? 0;
        int closed = stats.FirstOrDefault(s => s.Status == RfqStatus.Closed)?.Count ?? 0;
        int cancelled = stats.FirstOrDefault(s => s.Status == RfqStatus.Cancelled)?.Count ?? 0;

        return (total, draft, submitted, sent, closed, cancelled);
    }
}

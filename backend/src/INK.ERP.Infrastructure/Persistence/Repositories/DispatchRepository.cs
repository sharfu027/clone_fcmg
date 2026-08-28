using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class DispatchRepository : IDispatchRepository
{
    private readonly AppDbContext _context;

    public DispatchRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Dispatch?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Dispatches
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Dispatch?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Dispatches
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.InventoryLocation)
            .Include(x => x.PackTask)
                .ThenInclude(pt => pt!.Packages)
            .Include(x => x.DispatchedByEmployee)
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
                    .ThenInclude(p => p!.BaseUom)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Dispatch?> GetByOrderAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default)
    {
        return await _context.Dispatches
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.SalesOrderId == salesOrderId && x.DispatchStatus != DispatchStatuses.Cancelled, cancellationToken);
    }

    public async Task<IReadOnlyList<Dispatch>> ListAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? packTaskId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Dispatches
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.PackTask)
            .Include(x => x.DispatchedByEmployee)
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
                    .ThenInclude(p => p!.BaseUom)
            .AsQueryable();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (packTaskId.HasValue && packTaskId.Value != Guid.Empty)
            query = query.Where(x => x.PackTaskId == packTaskId.Value);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(x => x.DispatchStatus == status);

        if (fromDate.HasValue)
            query = query.Where(x => x.CreatedAtUtc >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(x => x.CreatedAtUtc <= toDate.Value);

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? packTaskId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Dispatches.AsQueryable();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (packTaskId.HasValue && packTaskId.Value != Guid.Empty)
            query = query.Where(x => x.PackTaskId == packTaskId.Value);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(x => x.DispatchStatus == status);

        if (fromDate.HasValue)
            query = query.Where(x => x.CreatedAtUtc >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(x => x.CreatedAtUtc <= toDate.Value);

        return await query.CountAsync(cancellationToken);
    }

    public async Task<string> GetNextDispatchNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        int year = DateTime.UtcNow.Year;
        string prefix = $"DSP-{year}-";

        var lastDispatch = await _context.Dispatches
            .Where(x => x.CompanyId == companyId && x.DispatchNumber.StartsWith(prefix))
            .OrderByDescending(x => x.DispatchNumber)
            .Select(x => x.DispatchNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextSeq = 1;
        if (!string.IsNullOrWhiteSpace(lastDispatch))
        {
            var parts = lastDispatch.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int currentSeq))
            {
                nextSeq = currentSeq + 1;
            }
        }

        return $"{prefix}{nextSeq:D6}";
    }

    public async Task AddAsync(Dispatch dispatch, CancellationToken cancellationToken = default)
    {
        await _context.Dispatches.AddAsync(dispatch, cancellationToken);
    }

    public Task UpdateAsync(Dispatch dispatch, CancellationToken cancellationToken = default)
    {
        if (_context.Entry(dispatch).State == EntityState.Detached)
        {
            _context.Dispatches.Update(dispatch);
        }
        return Task.CompletedTask;
    }
}

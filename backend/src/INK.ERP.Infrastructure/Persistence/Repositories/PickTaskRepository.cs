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

public class PickTaskRepository : IPickTaskRepository
{
    private readonly AppDbContext _context;

    public PickTaskRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<PickTask?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PickTasks
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PickTask?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PickTasks
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.InventoryLocation)
            .Include(x => x.AssignedEmployee)
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
                    .ThenInclude(p => p!.BaseUom)
            .Include(x => x.Lines)
                .ThenInclude(l => l.SalesOrderLine)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PickTask?> GetByOrderAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default)
    {
        return await _context.PickTasks
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.SalesOrderId == salesOrderId && x.Status != PickTaskStatuses.Cancelled, cancellationToken);
    }

    public async Task<IReadOnlyList<PickTask>> ListAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? locationId = null,
        Guid? employeeId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PickTasks
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.InventoryLocation)
            .Include(x => x.AssignedEmployee)
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
                    .ThenInclude(p => p!.BaseUom)
            .AsQueryable();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (locationId.HasValue && locationId.Value != Guid.Empty)
            query = query.Where(x => x.InventoryLocationId == locationId.Value);

        if (employeeId.HasValue && employeeId.Value != Guid.Empty)
            query = query.Where(x => x.AssignedEmployeeId == employeeId.Value);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(x => x.Status == status);

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
        Guid? locationId = null,
        Guid? employeeId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PickTasks.AsQueryable();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (locationId.HasValue && locationId.Value != Guid.Empty)
            query = query.Where(x => x.InventoryLocationId == locationId.Value);

        if (employeeId.HasValue && employeeId.Value != Guid.Empty)
            query = query.Where(x => x.AssignedEmployeeId == employeeId.Value);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(x => x.Status == status);

        if (fromDate.HasValue)
            query = query.Where(x => x.CreatedAtUtc >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(x => x.CreatedAtUtc <= toDate.Value);

        return await query.CountAsync(cancellationToken);
    }

    public async Task<string> GetNextPickTaskNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        int year = DateTime.UtcNow.Year;
        string prefix = $"PK-{year}-";

        var lastTask = await _context.PickTasks
            .Where(x => x.CompanyId == companyId && x.PickTaskNumber.StartsWith(prefix))
            .OrderByDescending(x => x.PickTaskNumber)
            .Select(x => x.PickTaskNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextSeq = 1;
        if (!string.IsNullOrWhiteSpace(lastTask))
        {
            var parts = lastTask.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int currentSeq))
            {
                nextSeq = currentSeq + 1;
            }
        }

        return $"{prefix}{nextSeq:D6}";
    }

    public async Task AddAsync(PickTask pickTask, CancellationToken cancellationToken = default)
    {
        await _context.PickTasks.AddAsync(pickTask, cancellationToken);
    }

    public Task UpdateAsync(PickTask pickTask, CancellationToken cancellationToken = default)
    {
        if (_context.Entry(pickTask).State == EntityState.Detached)
        {
            _context.PickTasks.Update(pickTask);
        }
        return Task.CompletedTask;
    }
}

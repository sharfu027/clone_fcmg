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

public class PackTaskRepository : IPackTaskRepository
{
    private readonly AppDbContext _context;

    public PackTaskRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<PackTask?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PackTasks
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PackTask?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PackTasks
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.PickTask)
                .ThenInclude(pk => pk!.Lines)
                    .ThenInclude(l => l.Product)
                        .ThenInclude(p => p!.BaseUom)
            .Include(x => x.AssignedEmployee)
            .Include(x => x.Packages)
                .ThenInclude(p => p.PackedByEmployee)
            .Include(x => x.Packages)
                .ThenInclude(p => p.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(pr => pr!.BaseUom)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PackTask?> GetByOrderAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default)
    {
        return await _context.PackTasks
            .Include(x => x.Packages)
                .ThenInclude(p => p.Items)
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.SalesOrderId == salesOrderId && x.Status != PackTaskStatuses.Cancelled, cancellationToken);
    }

    public async Task<PackTask?> GetByPickTaskIdAsync(Guid companyId, Guid pickTaskId, CancellationToken cancellationToken = default)
    {
        return await _context.PackTasks
            .Include(x => x.Packages)
                .ThenInclude(p => p.Items)
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.PickTaskId == pickTaskId && x.Status != PackTaskStatuses.Cancelled, cancellationToken);
    }

    public async Task<IReadOnlyList<PackTask>> ListAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        Guid? pickTaskId = null,
        Guid? employeeId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PackTasks
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.PickTask)
            .Include(x => x.AssignedEmployee)
            .Include(x => x.Packages)
                .ThenInclude(p => p.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(pr => pr!.BaseUom)
            .AsQueryable();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (pickTaskId.HasValue && pickTaskId.Value != Guid.Empty)
            query = query.Where(x => x.PickTaskId == pickTaskId.Value);

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
        Guid? pickTaskId = null,
        Guid? employeeId = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PackTasks.AsQueryable();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (pickTaskId.HasValue && pickTaskId.Value != Guid.Empty)
            query = query.Where(x => x.PickTaskId == pickTaskId.Value);

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

    public async Task<string> GetNextPackTaskNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        int year = DateTime.UtcNow.Year;
        string prefix = $"PCK-{year}-";

        var lastTask = await _context.PackTasks
            .Where(x => x.CompanyId == companyId && x.PackTaskNumber.StartsWith(prefix))
            .OrderByDescending(x => x.PackTaskNumber)
            .Select(x => x.PackTaskNumber)
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

    public async Task<string> GetNextPackageNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        int year = DateTime.UtcNow.Year;
        string prefix = $"PKG-{year}-";

        var lastPkg = await _context.Packages
            .Where(x => x.PackageNumber.StartsWith(prefix))
            .OrderByDescending(x => x.PackageNumber)
            .Select(x => x.PackageNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextSeq = 1;
        if (!string.IsNullOrWhiteSpace(lastPkg))
        {
            var parts = lastPkg.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int currentSeq))
            {
                nextSeq = currentSeq + 1;
            }
        }

        return $"{prefix}{nextSeq:D6}";
    }

    public async Task AddAsync(PackTask packTask, CancellationToken cancellationToken = default)
    {
        await _context.PackTasks.AddAsync(packTask, cancellationToken);
    }

    public async Task AddPackageAsync(Package package, CancellationToken cancellationToken = default)
    {
        await _context.Packages.AddAsync(package, cancellationToken);
    }

    public Task UpdateAsync(PackTask packTask, CancellationToken cancellationToken = default)
    {
        if (_context.Entry(packTask).State == EntityState.Detached)
        {
            _context.PackTasks.Update(packTask);
        }
        return Task.CompletedTask;
    }
}

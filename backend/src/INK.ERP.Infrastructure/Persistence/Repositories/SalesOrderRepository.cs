using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Sales;
using INK.ERP.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public sealed class SalesOrderRepository : ISalesOrderRepository
{
    private readonly AppDbContext _context;

    public SalesOrderRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<SalesOrder?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.SalesOrders
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<SalesOrder?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.SalesOrders
            .Include(x => x.Company)
            .Include(x => x.Customer)
            .Include(x => x.SalesEmployee)
            .Include(x => x.InventoryLocation)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.BaseUom)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<SalesOrder>> ListAsync(
        Guid? companyId = null,
        Guid? customerId = null,
        Guid? salesEmployeeId = null,
        string? status = null,
        string? search = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SalesOrders
            .Include(x => x.Company)
            .Include(x => x.Customer)
            .Include(x => x.SalesEmployee)
            .Include(x => x.InventoryLocation)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.BaseUom)
            .AsQueryable();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (customerId.HasValue && customerId.Value != Guid.Empty)
            query = query.Where(x => x.CustomerId == customerId.Value);

        if (salesEmployeeId.HasValue && salesEmployeeId.Value != Guid.Empty)
            query = query.Where(x => x.SalesEmployeeId == salesEmployeeId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.OrderStatus == status.Trim());

        if (fromDate.HasValue)
            query = query.Where(x => x.OrderDateUtc >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(x => x.OrderDateUtc <= toDate.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(x =>
                EF.Functions.ILike(x.OrderNumber, term) ||
                (x.Customer != null && EF.Functions.ILike(x.Customer.LegalName, term)));
        }

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GetNextOrderNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"SO-{year}-";
        var lastOrder = await _context.SalesOrders
            .Where(x => x.CompanyId == companyId && x.OrderNumber.StartsWith(prefix))
            .OrderByDescending(x => x.OrderNumber)
            .Select(x => x.OrderNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int seq = 1;
        if (lastOrder != null && lastOrder.Length > prefix.Length)
        {
            var seqStr = lastOrder[prefix.Length..];
            if (int.TryParse(seqStr, out var lastSeq))
                seq = lastSeq + 1;
        }

        return $"{prefix}{seq:D6}";
    }

    public async Task<bool> OrderNumberExistsAsync(Guid companyId, string orderNumber, CancellationToken cancellationToken = default)
    {
        return await _context.SalesOrders
            .AnyAsync(x => x.CompanyId == companyId && x.OrderNumber == orderNumber, cancellationToken);
    }

    public async Task AddAsync(SalesOrder order, CancellationToken cancellationToken = default)
    {
        if (order == null) throw new ArgumentNullException(nameof(order));
        await _context.SalesOrders.AddAsync(order, cancellationToken);
    }

    public Task UpdateAsync(SalesOrder order, CancellationToken cancellationToken = default)
    {
        if (order == null) throw new ArgumentNullException(nameof(order));
        if (_context.Entry(order).State == EntityState.Detached)
        {
            _context.SalesOrders.Update(order);
        }
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

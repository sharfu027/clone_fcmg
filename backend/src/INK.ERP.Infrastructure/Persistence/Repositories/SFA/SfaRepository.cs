using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.SFA;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories.SFA;

public sealed class SfaRepository : ISfaRepository
{
    private readonly AppDbContext _context;

    public SfaRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IReadOnlyList<Employee>> GetSalesRepsAsync(List<Guid> companyIds, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Employees
            .Include(e => e.Company)
            .Include(e => e.Designation)
            .Include(e => e.Department)
            .Include(e => e.EmployeeRole)
            .Where(e => e.IsActive);

        if (companyIds.Count > 0)
            query = query.Where(e => companyIds.Contains(e.CompanyId));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(e => e.FirstName.ToLower().Contains(s) || e.LastName.ToLower().Contains(s) || e.EmployeeCode.ToLower().Contains(s));
        }

        return await query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName).ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<Guid, int>> GetAssignmentCountsAsync(List<Guid> employeeIds, CancellationToken cancellationToken = default)
    {
        return await _context.SalesRepCustomerAssignments
            .Where(a => a.IsActive && !a.IsDeleted && employeeIds.Contains(a.EmployeeId))
            .GroupBy(a => a.EmployeeId)
            .Select(g => new { EmployeeId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EmployeeId, x => x.Count, cancellationToken);
    }

    public async Task<Dictionary<Guid, int>> GetBeatCountsAsync(List<Guid> employeeIds, CancellationToken cancellationToken = default)
    {
        return await _context.SalesBeats
            .Where(b => b.IsActive && !b.IsDeleted && b.SalesEmployeeId.HasValue && employeeIds.Contains(b.SalesEmployeeId.Value))
            .GroupBy(b => b.SalesEmployeeId!.Value)
            .Select(g => new { EmployeeId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EmployeeId, x => x.Count, cancellationToken);
    }

    public async Task<IReadOnlyList<SalesBeat>> GetSalesBeatsAsync(List<Guid> companyIds, Guid? salesEmployeeId = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SalesBeats
            .Include(b => b.Company)
            .Include(b => b.SalesEmployee)
            .Include(b => b.Customers)
                .ThenInclude(c => c.Customer)
            .Where(b => !b.IsDeleted);

        if (companyIds.Count > 0)
            query = query.Where(b => companyIds.Contains(b.CompanyId));

        if (salesEmployeeId.HasValue && salesEmployeeId.Value != Guid.Empty)
            query = query.Where(b => b.SalesEmployeeId == salesEmployeeId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(b => b.Name.ToLower().Contains(s) || b.Code.ToLower().Contains(s));
        }

        return await query.OrderBy(b => b.Name).ToListAsync(cancellationToken);
    }

    public async Task<SalesBeat?> GetSalesBeatByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.SalesBeats
            .Include(b => b.Company)
            .Include(b => b.SalesEmployee)
            .Include(b => b.Customers)
                .ThenInclude(c => c.Customer)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, cancellationToken);
    }

    public async Task AddSalesBeatAsync(SalesBeat beat, CancellationToken cancellationToken = default)
    {
        await _context.SalesBeats.AddAsync(beat, cancellationToken);
    }

    public Task UpdateSalesBeatAsync(SalesBeat beat, CancellationToken cancellationToken = default)
    {
        _context.SalesBeats.Update(beat);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<SalesRepCustomerAssignment>> GetCustomerAssignmentsAsync(List<Guid> companyIds, Guid? employeeId = null, Guid? customerId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SalesRepCustomerAssignments
            .Include(a => a.Employee)
            .Include(a => a.Customer)
            .Where(a => a.IsActive && !a.IsDeleted);

        if (companyIds.Count > 0)
            query = query.Where(a => companyIds.Contains(a.CompanyId));

        if (employeeId.HasValue && employeeId.Value != Guid.Empty)
            query = query.Where(a => a.EmployeeId == employeeId.Value);

        if (customerId.HasValue && customerId.Value != Guid.Empty)
            query = query.Where(a => a.CustomerId == customerId.Value);

        return await query.OrderBy(a => a.CreatedAtUtc).ToListAsync(cancellationToken);
    }

    public async Task<SalesRepCustomerAssignment?> GetCustomerAssignmentByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.SalesRepCustomerAssignments
            .Include(a => a.Employee)
            .Include(a => a.Customer)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, cancellationToken);
    }

    public async Task<SalesRepCustomerAssignment?> GetActiveAssignmentAsync(Guid companyId, Guid employeeId, Guid customerId, CancellationToken cancellationToken = default)
    {
        return await _context.SalesRepCustomerAssignments
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.EmployeeId == employeeId && a.CustomerId == customerId && a.IsActive && !a.IsDeleted, cancellationToken);
    }

    public async Task AddCustomerAssignmentAsync(SalesRepCustomerAssignment assignment, CancellationToken cancellationToken = default)
    {
        await _context.SalesRepCustomerAssignments.AddAsync(assignment, cancellationToken);
    }

    public Task UpdateCustomerAssignmentAsync(SalesRepCustomerAssignment assignment, CancellationToken cancellationToken = default)
    {
        _context.SalesRepCustomerAssignments.Update(assignment);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<SalesVisit>> GetSalesVisitsAsync(List<Guid> companyIds, Guid? salesEmployeeId = null, Guid? customerId = null, DateTime? fromDate = null, DateTime? toDate = null, string? outcome = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SalesVisits
            .Include(v => v.SalesEmployee)
            .Include(v => v.Customer)
            .Where(v => !v.IsDeleted);

        if (companyIds.Count > 0)
            query = query.Where(v => companyIds.Contains(v.CompanyId));

        if (salesEmployeeId.HasValue && salesEmployeeId.Value != Guid.Empty)
            query = query.Where(v => v.SalesEmployeeId == salesEmployeeId.Value);

        if (customerId.HasValue && customerId.Value != Guid.Empty)
            query = query.Where(v => v.CustomerId == customerId.Value);

        if (fromDate.HasValue)
            query = query.Where(v => v.VisitDateUtc >= fromDate.Value.Date);

        if (toDate.HasValue)
            query = query.Where(v => v.VisitDateUtc <= toDate.Value.Date);

        if (!string.IsNullOrWhiteSpace(outcome))
            query = query.Where(v => v.Outcome == outcome);

        return await query.OrderByDescending(v => v.CheckInAtUtc).ToListAsync(cancellationToken);
    }

    public async Task<SalesVisit?> GetSalesVisitByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.SalesVisits
            .Include(v => v.SalesEmployee)
            .Include(v => v.Customer)
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted, cancellationToken);
    }

    public async Task AddSalesVisitAsync(SalesVisit visit, CancellationToken cancellationToken = default)
    {
        await _context.SalesVisits.AddAsync(visit, cancellationToken);
    }

    public Task UpdateSalesVisitAsync(SalesVisit visit, CancellationToken cancellationToken = default)
    {
        _context.SalesVisits.Update(visit);
        return Task.CompletedTask;
    }

    public async Task<(int TotalVisits, int CompletedVisits, int OrdersCount, decimal OrdersValue, int GpsVerifiedVisits)> GetDashboardMetricsAsync(List<Guid> companyIds, Guid? salesEmployeeId = null, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var visitQuery = _context.SalesVisits.Where(v => !v.IsDeleted && v.VisitDateUtc >= today && v.VisitDateUtc < tomorrow);
        var orderQuery = _context.SalesOrders.Where(o => o.OrderStatus != "Cancelled" && o.OrderDateUtc >= today && o.OrderDateUtc < tomorrow);

        if (companyIds.Count > 0)
        {
            visitQuery = visitQuery.Where(v => companyIds.Contains(v.CompanyId));
            orderQuery = orderQuery.Where(o => companyIds.Contains(o.CompanyId));
        }

        if (salesEmployeeId.HasValue && salesEmployeeId.Value != Guid.Empty)
        {
            visitQuery = visitQuery.Where(v => v.SalesEmployeeId == salesEmployeeId.Value);
            orderQuery = orderQuery.Where(o => o.SalesEmployeeId == salesEmployeeId.Value);
        }

        var todayVisits = await visitQuery.ToListAsync(cancellationToken);
        var todayOrders = await orderQuery.ToListAsync(cancellationToken);

        int totalVisits = todayVisits.Count;
        int completedVisits = todayVisits.Count(v => v.CheckOutAtUtc.HasValue || v.Outcome == "OrderBooked" || v.Outcome == "Completed");
        int gpsVerifiedVisits = todayVisits.Count(v => v.IsGpsVerified);

        int ordersCount = todayOrders.Count;
        decimal ordersValue = todayOrders.Sum(o => o.TotalAmount);

        return (totalVisits, completedVisits, ordersCount, ordersValue, gpsVerifiedVisits);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

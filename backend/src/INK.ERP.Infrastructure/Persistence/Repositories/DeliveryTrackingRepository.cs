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

public sealed class DeliveryTrackingRepository : GenericRepository<DeliveryTracking>, IDeliveryTrackingRepository
{
    public DeliveryTrackingRepository(AppDbContext context) : base(context)
    {
    }

    public override async Task<DeliveryTracking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.DeliveryTrackings
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.Dispatch)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<DeliveryTracking?> GetBySalesOrderIdAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default)
    {
        return await _context.DeliveryTrackings
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.Dispatch)
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.SalesOrderId == salesOrderId, cancellationToken);
    }

    public async Task<DeliveryTracking?> GetByTrackingNumberAsync(Guid companyId, string trackingNumber, CancellationToken cancellationToken = default)
    {
        return await _context.DeliveryTrackings
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.Dispatch)
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.TrackingNumber == trackingNumber, cancellationToken);
    }

    public async Task<IReadOnlyList<DeliveryTracking>> ListAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        string? status = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.DeliveryTrackings
            .Include(x => x.Company)
            .Include(x => x.SalesOrder)
                .ThenInclude(so => so!.Customer)
            .Include(x => x.Dispatch)
            .AsNoTracking();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GetNextTrackingNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var count = await _context.DeliveryTrackings.CountAsync(x => x.CompanyId == companyId, cancellationToken);
        var year = DateTime.UtcNow.ToString("yyyyMM");
        return $"TRK-{year}-{(count + 1):D5}";
    }
}

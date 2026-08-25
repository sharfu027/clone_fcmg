using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class InventoryReservationRepository : IInventoryReservationRepository
{
    private readonly AppDbContext _context;

    public InventoryReservationRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<InventoryReservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.InventoryReservations
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<InventoryReservation?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.InventoryReservations
            .Include(x => x.Company)
            .Include(x => x.InventoryLocation)
            .Include(x => x.Product)
                .ThenInclude(p => p!.BaseUom)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryReservation>> ListAsync(
        Guid? companyId = null,
        Guid? inventoryLocationId = null,
        Guid? productId = null,
        string? status = null,
        Guid? salesOrderId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.InventoryReservations
            .Include(x => x.Company)
            .Include(x => x.InventoryLocation)
            .Include(x => x.Product)
                .ThenInclude(p => p!.BaseUom)
            .AsQueryable();

        // Apply company filter only when a specific company is scoped (non-SuperAdmin or explicit filter)
        if (companyId.HasValue && companyId.Value != Guid.Empty)
        {
            query = query.Where(x => x.CompanyId == companyId.Value);
        }

        if (inventoryLocationId.HasValue && inventoryLocationId.Value != Guid.Empty)
        {
            query = query.Where(x => x.InventoryLocationId == inventoryLocationId.Value);
        }

        if (productId.HasValue && productId.Value != Guid.Empty)
        {
            query = query.Where(x => x.ProductId == productId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var trimmedStatus = status.Trim();
            query = query.Where(x => x.Status == trimmedStatus);
        }

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
        {
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(x => x.ReservedAtUtc >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(x => x.ReservedAtUtc <= toDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(x =>
                (x.Product != null && (EF.Functions.ILike(x.Product.Name, term) || EF.Functions.ILike(x.Product.Code, term) || (x.Product.Sku != null && EF.Functions.ILike(x.Product.Sku, term)))) ||
                (x.InventoryLocation != null && (EF.Functions.ILike(x.InventoryLocation.Name, term) || EF.Functions.ILike(x.InventoryLocation.Code, term))));
        }

        return await query
            .OrderByDescending(x => x.ReservedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryReservation>> GetActiveReservationsForProductAndLocationAsync(
        Guid companyId,
        Guid inventoryLocationId,
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        return await _context.InventoryReservations
            .Where(x => x.CompanyId == companyId &&
                        x.InventoryLocationId == inventoryLocationId &&
                        x.ProductId == productId &&
                        x.Status == InventoryReservationStatuses.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryReservation>> GetExpiredActiveReservationsAsync(
        Guid companyId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        return await _context.InventoryReservations
            .Where(x => x.CompanyId == companyId &&
                        x.Status == InventoryReservationStatuses.Active &&
                        x.ExpiresAtUtc.HasValue &&
                        x.ExpiresAtUtc.Value < asOfUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(InventoryReservation reservation, CancellationToken cancellationToken = default)
    {
        if (reservation == null) throw new ArgumentNullException(nameof(reservation));
        await _context.InventoryReservations.AddAsync(reservation, cancellationToken);
    }

    public Task UpdateAsync(InventoryReservation reservation, CancellationToken cancellationToken = default)
    {
        if (reservation == null) throw new ArgumentNullException(nameof(reservation));
        _context.InventoryReservations.Update(reservation);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

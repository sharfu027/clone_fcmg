using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public sealed class StockTransferRepository : IStockTransferRepository
{
    private readonly AppDbContext _context;

    public StockTransferRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<StockTransfer?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.StockTransfers
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<StockTransfer?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.StockTransfers
            .Include(x => x.Company)
            .Include(x => x.SourceLocation)
            .Include(x => x.DestinationLocation)
            .Include(x => x.SalesOrder)
            .Include(x => x.RequestedByEmployee)
            .Include(x => x.ApprovedByEmployee)
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
                    .ThenInclude(p => p!.BaseUom)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<StockTransfer>> ListAsync(
        Guid? companyId = null,
        Guid? sourceLocationId = null,
        Guid? destinationLocationId = null,
        Guid? salesOrderId = null,
        string? status = null,
        string? search = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.StockTransfers
            .Include(x => x.SourceLocation)
            .Include(x => x.DestinationLocation)
            .Include(x => x.RequestedByEmployee)
            .Include(x => x.SalesOrder)
            .AsQueryable();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (sourceLocationId.HasValue && sourceLocationId.Value != Guid.Empty)
            query = query.Where(x => x.SourceLocationId == sourceLocationId.Value);

        if (destinationLocationId.HasValue && destinationLocationId.Value != Guid.Empty)
            query = query.Where(x => x.DestinationLocationId == destinationLocationId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status.Trim());

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(x =>
                EF.Functions.ILike(x.TransferNumber, term) ||
                (x.SourceLocation != null && EF.Functions.ILike(x.SourceLocation.Name, term)) ||
                (x.DestinationLocation != null && EF.Functions.ILike(x.DestinationLocation.Name, term)));
        }

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GetNextTransferNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"TRF-{year}-";
        var last = await _context.StockTransfers
            .Where(x => x.CompanyId == companyId && x.TransferNumber.StartsWith(prefix))
            .OrderByDescending(x => x.TransferNumber)
            .Select(x => x.TransferNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int seq = 1;
        if (last != null && last.Length > prefix.Length)
        {
            var seqStr = last[prefix.Length..];
            if (int.TryParse(seqStr, out var lastSeq))
                seq = lastSeq + 1;
        }

        return $"{prefix}{seq:D6}";
    }

    public async Task AddAsync(StockTransfer transfer, CancellationToken cancellationToken = default)
    {
        if (transfer == null) throw new ArgumentNullException(nameof(transfer));
        await _context.StockTransfers.AddAsync(transfer, cancellationToken);
    }

    public Task UpdateAsync(StockTransfer transfer, CancellationToken cancellationToken = default)
    {
        if (transfer == null) throw new ArgumentNullException(nameof(transfer));
        _context.StockTransfers.Update(transfer);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

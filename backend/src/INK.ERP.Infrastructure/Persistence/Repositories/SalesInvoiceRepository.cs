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

public sealed class SalesInvoiceRepository : GenericRepository<SalesInvoice>, ISalesInvoiceRepository
{
    public SalesInvoiceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<SalesInvoice?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.SalesInvoices
            .Include(x => x.Company)
            .Include(x => x.Customer)
            .Include(x => x.SalesOrder)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.BaseUom)
            .Include(x => x.Payments)
                .ThenInclude(p => p.ReceivedByEmployee)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<SalesInvoice?> GetBySalesOrderIdAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default)
    {
        return await _context.SalesInvoices
            .Include(x => x.Company)
            .Include(x => x.Customer)
            .Include(x => x.SalesOrder)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.SalesOrderId == salesOrderId, cancellationToken);
    }

    public async Task<IReadOnlyList<SalesInvoice>> ListAsync(
        Guid? companyId = null,
        Guid? customerId = null,
        Guid? salesOrderId = null,
        string? status = null,
        string? paymentStatus = null,
        string? search = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SalesInvoices
            .Include(x => x.Company)
            .Include(x => x.Customer)
            .Include(x => x.SalesOrder)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.BaseUom)
            .Include(x => x.Payments)
            .AsNoTracking();

        if (companyId.HasValue && companyId.Value != Guid.Empty)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (customerId.HasValue && customerId.Value != Guid.Empty)
            query = query.Where(x => x.CustomerId == customerId.Value);

        if (salesOrderId.HasValue && salesOrderId.Value != Guid.Empty)
            query = query.Where(x => x.SalesOrderId == salesOrderId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);

        if (!string.IsNullOrWhiteSpace(paymentStatus))
            query = query.Where(x => x.PaymentStatus == paymentStatus);

        if (fromDate.HasValue)
            query = query.Where(x => x.InvoiceDateUtc >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(x => x.InvoiceDateUtc <= toDate.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.InvoiceNumber.ToLower().Contains(term) ||
                (x.Customer != null && (x.Customer.LegalName.ToLower().Contains(term) || x.Customer.Code.ToLower().Contains(term))) ||
                (x.Irn != null && x.Irn.ToLower().Contains(term)));
        }

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GetNextInvoiceNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var count = await _context.SalesInvoices.CountAsync(x => x.CompanyId == companyId, cancellationToken);
        var year = DateTime.UtcNow.ToString("yyyy");
        return $"INV-{year}-{(count + 1):D5}";
    }

    public async Task<string> GetNextPaymentNumberAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var count = await _context.InvoicePayments.CountAsync(x => x.CompanyId == companyId, cancellationToken);
        var year = DateTime.UtcNow.ToString("yyyy");
        return $"PAY-{year}-{(count + 1):D5}";
    }

    public async Task AddPaymentAsync(InvoicePayment payment, CancellationToken cancellationToken = default)
    {
        await _context.InvoicePayments.AddAsync(payment, cancellationToken);
    }
}

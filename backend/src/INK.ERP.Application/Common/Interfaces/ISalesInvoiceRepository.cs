using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Common.Interfaces;

public interface ISalesInvoiceRepository : IGenericRepository<SalesInvoice>
{
    Task<SalesInvoice?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SalesInvoice?> GetBySalesOrderIdAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SalesInvoice>> ListAsync(
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
        CancellationToken cancellationToken = default);
    Task<string> GetNextInvoiceNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<string> GetNextPaymentNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task AddPaymentAsync(InvoicePayment payment, CancellationToken cancellationToken = default);
}

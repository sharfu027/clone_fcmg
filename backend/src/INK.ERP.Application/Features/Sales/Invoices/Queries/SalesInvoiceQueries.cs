using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Sales.Invoices.Commands;
using INK.ERP.Application.Features.Sales.Invoices.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.Sales.Invoices.Queries;

public record GetSalesInvoicesPagedQuery(
    Guid? CompanyId = null,
    Guid? CustomerId = null,
    Guid? SalesOrderId = null,
    string? Status = null,
    string? PaymentStatus = null,
    string? Search = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<IReadOnlyList<SalesInvoiceDto>>>;

public class GetSalesInvoicesPagedQueryHandler : IRequestHandler<GetSalesInvoicesPagedQuery, Result<IReadOnlyList<SalesInvoiceDto>>>
{
    private readonly ISalesInvoiceRepository _invoiceRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSalesInvoicesPagedQueryHandler(
        ISalesInvoiceRepository invoiceRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _invoiceRepository = invoiceRepository ?? throw new ArgumentNullException(nameof(invoiceRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<SalesInvoiceDto>>> Handle(GetSalesInvoicesPagedQuery request, CancellationToken cancellationToken)
    {
        Guid? effectiveCompanyId = request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(effectiveCompanyId.Value, cancellationToken);
            if (!hasAccess)
                return Result<IReadOnlyList<SalesInvoiceDto>>.Failure(Error.Unauthorized("Invoice.Unauthorized", "Unauthorized access to requested company."));
        }
        else
        {
            effectiveCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        }

        var list = await _invoiceRepository.ListAsync(
            effectiveCompanyId,
            request.CustomerId,
            request.SalesOrderId,
            request.Status,
            request.PaymentStatus,
            request.Search,
            request.FromDate,
            request.ToDate,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = list.Select(CreateSalesInvoiceFromOrderCommandHandler.MapInvoice).ToList();
        return Result.Success<IReadOnlyList<SalesInvoiceDto>>(dtos);
    }
}

public record GetSalesInvoiceByIdQuery(Guid Id) : IRequest<Result<SalesInvoiceDto>>;

public class GetSalesInvoiceByIdQueryHandler : IRequestHandler<GetSalesInvoiceByIdQuery, Result<SalesInvoiceDto>>
{
    private readonly ISalesInvoiceRepository _invoiceRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSalesInvoiceByIdQueryHandler(
        ISalesInvoiceRepository invoiceRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _invoiceRepository = invoiceRepository ?? throw new ArgumentNullException(nameof(invoiceRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<SalesInvoiceDto>> Handle(GetSalesInvoiceByIdQuery request, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (invoice == null)
            return Result<SalesInvoiceDto>.Failure(Error.NotFound("Invoice.NotFound", "Sales invoice not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(invoice.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesInvoiceDto>.Failure(Error.Unauthorized("Invoice.Unauthorized", "Unauthorized access to company invoice."));

        return Result.Success(CreateSalesInvoiceFromOrderCommandHandler.MapInvoice(invoice));
    }
}

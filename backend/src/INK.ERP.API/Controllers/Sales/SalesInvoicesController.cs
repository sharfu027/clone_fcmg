using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Sales.Invoices.Commands;
using INK.ERP.Application.Features.Sales.Invoices.DTOs;
using INK.ERP.Application.Features.Sales.Invoices.Queries;

namespace INK.ERP.API.Controllers.Sales;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sales/invoices")]
public class SalesInvoicesController : BaseApiController
{
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(SalesInvoiceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateSalesInvoiceFromOrderCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<SalesInvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? salesOrderId,
        [FromQuery] string? status,
        [FromQuery] string? paymentStatus,
        [FromQuery] string? search,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetSalesInvoicesPagedQuery(
            companyId, customerId, salesOrderId, status, paymentStatus, search, fromDate, toDate, page, pageSize);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(SalesInvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInvoiceById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetSalesInvoiceByIdQuery(id), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/issue")]
    [Authorize]
    [ProducesResponseType(typeof(SalesInvoiceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> IssueInvoice(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new IssueSalesInvoiceCommand(id), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/payments")]
    [Authorize]
    [ProducesResponseType(typeof(SalesInvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecordPayment(Guid id, [FromBody] RecordInvoicePaymentRequest request, CancellationToken cancellationToken)
    {
        var command = new RecordInvoicePaymentCommand(
            id, request.Amount, request.PaymentMode, request.ReferenceNumber, request.Notes, request.ReceivedByEmployeeId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/e-invoice/generate")]
    [Authorize]
    [ProducesResponseType(typeof(EInvoiceResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateEInvoice(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GenerateEInvoiceCommand(id), cancellationToken);
        return HandleResult(result);
    }
}

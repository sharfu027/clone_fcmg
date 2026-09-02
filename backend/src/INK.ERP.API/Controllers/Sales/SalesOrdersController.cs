using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Sales.Orders.Commands;
using INK.ERP.Application.Features.Sales.Orders.DTOs;
using INK.ERP.Application.Features.Sales.Orders.Queries;
using Microsoft.Extensions.DependencyInjection;

namespace INK.ERP.API.Controllers.Sales;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sales/orders")]
public class SalesOrdersController : BaseApiController
{
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(SalesOrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateSalesOrderCommand command, CancellationToken cancellationToken)
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
    [ProducesResponseType(typeof(IReadOnlyList<SalesOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? salesEmployeeId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetSalesOrdersPagedQuery(
            companyId,
            customerId,
            salesEmployeeId,
            status,
            search,
            fromDate,
            toDate,
            page,
            pageSize);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(SalesOrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetSalesOrderByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(SalesOrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrder(Guid id, [FromBody] UpdateSalesOrderRequest request, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new UpdateSalesOrderCommand(
            id,
            request.SalesEmployeeId,
            request.InventoryLocationId,
            request.OrderDateUtc,
            request.Notes,
            request.Items,
            companyId);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("verify-field-location")]
    [Authorize]
    [ProducesResponseType(typeof(VerifyFieldLocationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyFieldLocation([FromBody] VerifyFieldLocationRequest request, CancellationToken cancellationToken)
    {
        var command = new VerifyFieldSalesOrderLocationCommand(
            request.CompanyId,
            request.CustomerId,
            request.SalesEmployeeId,
            request.CaptureLatitude,
            request.CaptureLongitude,
            request.AccuracyMeters,
            request.FaceImageBase64,
            request.RequireFaceVerification);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("resolve-price")]
    [Authorize]
    [ProducesResponseType(typeof(PriceResolutionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResolvePrice(
        [FromQuery] Guid companyId,
        [FromQuery] Guid productId,
        [FromQuery] Guid? customerId,
        [FromQuery] DateTime? targetDate,
        CancellationToken cancellationToken)
    {
        var pricingService = HttpContext.RequestServices.GetRequiredService<INK.ERP.Application.Common.Interfaces.IPricingResolutionService>();
        var result = await pricingService.ResolvePriceAsync(companyId, customerId, productId, targetDate, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/submit")]
    [Authorize]
    [ProducesResponseType(typeof(SalesOrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitOrder(Guid id, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new SubmitSalesOrderCommand(id, companyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(SalesOrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelOrder(Guid id, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new CancelSalesOrderCommand(id, companyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

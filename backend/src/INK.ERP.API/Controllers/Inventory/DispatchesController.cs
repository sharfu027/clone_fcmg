using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Inventory.Fulfillment.Commands;
using INK.ERP.Application.Features.Inventory.Fulfillment.DTOs;
using INK.ERP.Application.Features.Inventory.Fulfillment.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory/dispatches")]
public class DispatchesController : BaseApiController
{
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(DispatchDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateDispatch([FromBody] CreateDispatchCommand command, CancellationToken cancellationToken)
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
    [ProducesResponseType(typeof(IReadOnlyList<DispatchDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDispatches(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? salesOrderId,
        [FromQuery] Guid? packTaskId,
        [FromQuery] string? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(new GetDispatchesPagedQuery(
            companyId, salesOrderId, packTaskId, status, fromDate, toDate, page, pageSize), cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(DispatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDispatchById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetDispatchByIdQuery(id), cancellationToken);
        return HandleResult(result);
    }

    public record ConfirmDispatchPayload(Guid? DispatchedByEmployeeId = null, string? Notes = null);

    [HttpPost("{id:guid}/confirm")]
    [Authorize]
    [ProducesResponseType(typeof(DispatchDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ConfirmDispatch(Guid id, [FromBody] ConfirmDispatchPayload? payload, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new ConfirmDispatchCommand(
            id, payload?.DispatchedByEmployeeId, payload?.Notes), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(DispatchDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelDispatch(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new CancelDispatchCommand(id), cancellationToken);
        return HandleResult(result);
    }
}

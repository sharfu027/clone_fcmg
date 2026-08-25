using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Inventory.Transfers.Commands;
using INK.ERP.Application.Features.Inventory.Transfers.DTOs;
using INK.ERP.Application.Features.Inventory.Transfers.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory/transfers")]
public class StockTransfersController : BaseApiController
{
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTransfer([FromBody] CreateStockTransferCommand command, CancellationToken cancellationToken)
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
    [ProducesResponseType(typeof(IReadOnlyList<StockTransferDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransfers(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? sourceLocationId,
        [FromQuery] Guid? destinationLocationId,
        [FromQuery] Guid? salesOrderId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetStockTransfersPagedQuery(
            companyId,
            sourceLocationId,
            destinationLocationId,
            salesOrderId,
            status,
            search,
            page,
            pageSize);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransferById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetStockTransferByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveTransfer(Guid id, [FromBody] ApproveStockTransferRequest body, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new ApproveStockTransferCommand(id, body.ApprovedByEmployeeId, body.LineApprovals, companyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/dispatch")]
    [Authorize]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DispatchTransfer(Guid id, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new DispatchStockTransferCommand(id, companyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/receive")]
    [Authorize]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReceiveTransfer(Guid id, [FromBody] ReceiveStockTransferRequest? body, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new ReceiveStockTransferCommand(id, body?.LineReceipts, companyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelTransfer(Guid id, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new CancelStockTransferCommand(id, companyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

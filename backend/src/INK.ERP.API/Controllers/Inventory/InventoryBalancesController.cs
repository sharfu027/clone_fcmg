using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Inventory.Balances.Commands;
using INK.ERP.Application.Features.Inventory.Balances.DTOs;
using INK.ERP.Application.Features.Inventory.Balances.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory/balances")]
public class InventoryBalancesController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of inventory balances with optional filters.
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryBalanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBalances(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? inventoryLocationId,
        [FromQuery] Guid? productId,
        [FromQuery] string? search,
        [FromQuery] bool? isActiveLocation,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetInventoryBalancesPagedQuery(
            companyId,
            inventoryLocationId,
            productId,
            search,
            isActiveLocation,
            page,
            pageSize);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single inventory balance record by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryBalanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBalanceById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetInventoryBalanceByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Adjusts / edits an inventory balance record (corrects quantity, batch number, expiry date) and logs an audit transaction in the ledger.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryBalanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AdjustBalance(Guid id, [FromBody] AdjustInventoryBalanceRequest request, CancellationToken cancellationToken)
    {
        var command = new AdjustInventoryBalanceCommand(
            id,
            request.NewOnHandQuantity,
            request.BatchNumber,
            request.ExpiryDate,
            request.Reason,
            request.ReleaseExcessReservations,
            request.MinStockQuantity);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Removes a mistakenly added inventory balance record from the system, releases active reservations, and zeroes out the ledger.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBalance(
        Guid id,
        [FromQuery] string? reason,
        [FromQuery] bool releaseReservations = true,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteInventoryBalanceCommand(id, reason, releaseReservations);
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess)
        {
            return NoContent();
        }
        return HandleResult(result);
    }
}

public record AdjustInventoryBalanceRequest(
    decimal NewOnHandQuantity,
    string? BatchNumber = null,
    DateTime? ExpiryDate = null,
    string? Reason = null,
    bool ReleaseExcessReservations = true,
    decimal? MinStockQuantity = null);

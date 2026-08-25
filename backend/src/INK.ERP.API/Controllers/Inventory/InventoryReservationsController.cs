using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Inventory.Reservations.Commands;
using INK.ERP.Application.Features.Inventory.Reservations.DTOs;
using INK.ERP.Application.Features.Inventory.Reservations.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory")]
public class InventoryReservationsController : BaseApiController
{
    /// <summary>
    /// Evaluates real-time stock availability at a specified location.
    /// </summary>
    [HttpGet("availability")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryAvailabilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStockAvailability(
        [FromQuery] Guid companyId,
        [FromQuery] Guid productId,
        [FromQuery] Guid inventoryLocationId,
        [FromQuery] decimal requestedQuantity = 1,
        CancellationToken cancellationToken = default)
    {
        var query = new GetStockAvailabilityQuery(companyId, productId, inventoryLocationId, requestedQuantity);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Finds and ranks alternative inventory locations holding available stock for a product.
    /// </summary>
    [HttpGet("availability/alternatives")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryAlternativeLocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAlternateLocations(
        [FromQuery] Guid companyId,
        [FromQuery] Guid productId,
        [FromQuery] decimal requestedQuantity = 1,
        [FromQuery] Guid? excludedLocationId = null,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAlternateLocationsQuery(companyId, productId, requestedQuantity, excludedLocationId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates an atomic stock reservation against available inventory.
    /// </summary>
    [HttpPost("reservations")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryReservationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReserveStock(
        [FromBody] ReserveStockCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a paged list of stock reservations with optional filters.
    /// </summary>
    [HttpGet("reservations")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryReservationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReservations(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? inventoryLocationId,
        [FromQuery] Guid? productId,
        [FromQuery] string? status,
        [FromQuery] Guid? salesOrderId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetInventoryReservationsPagedQuery(
            companyId,
            inventoryLocationId,
            productId,
            status,
            salesOrderId,
            fromDate,
            toDate,
            search,
            page,
            pageSize);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a specific inventory reservation by ID.
    /// </summary>
    [HttpGet("reservations/{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryReservationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReservationById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetInventoryReservationByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Releases an active reservation, restoring Available stock without changing OnHand.
    /// </summary>
    [HttpPost("reservations/{id:guid}/release")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryReservationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReleaseReservation(Guid id, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new ReleaseReservationCommand(id, companyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Cancels a pending or active reservation.
    /// </summary>
    [HttpPost("reservations/{id:guid}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryReservationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelReservation(Guid id, [FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        var command = new CancelReservationCommand(id, companyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

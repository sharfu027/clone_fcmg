using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.API.Models;
using INK.ERP.Application.Features.Inventory.Locations.Commands;
using INK.ERP.Application.Features.Inventory.Locations.DTOs;
using INK.ERP.Application.Features.Inventory.Locations.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory/locations")]
public class InventoryLocationsController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of inventory locations with optional filters.
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryLocationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLocations(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? branchId,
        [FromQuery] Guid? warehouseId,
        [FromQuery] Guid? departmentId,
        [FromQuery] string? locationType,
        [FromQuery] bool? isActive,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetInventoryLocationsPagedQuery(
            companyId,
            branchId,
            warehouseId,
            departmentId,
            locationType,
            isActive,
            search,
            page,
            pageSize);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single inventory location by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryLocationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLocationById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetInventoryLocationByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new inventory location.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(InventoryLocationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateLocation([FromBody] CreateInventoryLocationCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing inventory location.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryLocationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateInventoryLocationCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(new ProblemDetails { Title = "ID Mismatch", Detail = "Path ID does not match body ID." });
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Soft deletes / deactivates an inventory location.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLocation(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteInventoryLocationCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess)
        {
            return NoContent();
        }
        return HandleResult(result);
    }
}

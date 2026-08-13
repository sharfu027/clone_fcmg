using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.API.Models;
using INK.ERP.Application.Features.MasterData.Designations.Commands;
using INK.ERP.Application.Features.MasterData.Designations.DTOs;
using INK.ERP.Application.Features.MasterData.Designations.Queries;

namespace INK.ERP.API.Controllers.MasterData;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/masters/designation")]
public class DesignationController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of designations with optional company filter, search, and status.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(IReadOnlyList<DesignationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDesignations([FromQuery] Guid? companyId, [FromQuery] SecurityFilterParameters filter, CancellationToken cancellationToken)
    {
        var query = new GetDesignationsPagedQuery(companyId, filter.Page, filter.PageSize, filter.Search, filter.Status);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single designation by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(DesignationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDesignationById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetDesignationByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new job title designation.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IAM.Users.Create")]
    [ProducesResponseType(typeof(DesignationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateDesignation([FromBody] CreateDesignationCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return CreatedAtAction(nameof(GetDesignationById), new { id = result.Value.Id }, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing designation.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(DesignationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDesignation(Guid id, [FromBody] UpdateDesignationCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Route ID Mismatch",
                Detail = "The designation ID in the route URL does not match the command payload ID.",
                Instance = HttpContext.Request.Path
            });
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Deactivates / soft-deletes a designation.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDesignation(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteDesignationCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

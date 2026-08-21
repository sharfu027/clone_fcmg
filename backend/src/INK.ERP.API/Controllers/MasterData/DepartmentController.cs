using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.API.Models;
using INK.ERP.Application.Features.MasterData.Departments.Commands;
using INK.ERP.Application.Features.MasterData.Departments.DTOs;
using INK.ERP.Application.Features.MasterData.Departments.Queries;

namespace INK.ERP.API.Controllers.MasterData;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/masters/department")]
public class DepartmentController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of departments with optional company and branch filters, search, and status.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(IReadOnlyList<DepartmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDepartments([FromQuery] Guid? companyId, [FromQuery] Guid? branchId, [FromQuery] SecurityFilterParameters filter, CancellationToken cancellationToken)
    {
        var query = new GetDepartmentsPagedQuery(companyId, branchId, filter.Page, filter.PageSize, filter.Search, filter.Status);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single department by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(DepartmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDepartmentById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetDepartmentByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new department under a branch.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IAM.Users.Create")]
    [ProducesResponseType(typeof(DepartmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return CreatedAtAction(nameof(GetDepartmentById), new { id = result.Value.Id }, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing department.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(DepartmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Route ID Mismatch",
                Detail = "The department ID in the route URL does not match the command payload ID.",
                Instance = HttpContext.Request.Path
            });
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Deactivates / soft-deletes a department.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDepartment(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteDepartmentCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.API.Models;
using INK.ERP.Application.Features.MasterData.Employees.Commands;
using INK.ERP.Application.Features.MasterData.Employees.DTOs;
using INK.ERP.Application.Features.MasterData.Employees.Queries;

namespace INK.ERP.API.Controllers.MasterData;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/masters/employee")]
[Authorize(Policy = "Masters.Employee")]
public class EmployeeController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of employees with optional company/branch/department filter, search, and status.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(IReadOnlyList<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployees([FromQuery] Guid? companyId, [FromQuery] Guid? branchId, [FromQuery] Guid? departmentId, [FromQuery] SecurityFilterParameters filter, CancellationToken cancellationToken)
    {
        var query = new GetEmployeesPagedQuery(companyId, branchId, departmentId, filter.Page, filter.PageSize, filter.Search, filter.Status);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single employee profile by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeeById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetEmployeeByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new employee staff record.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IAM.Users.Create")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return CreatedAtAction(nameof(GetEmployeeById), new { id = result.Value.Id }, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing employee staff record.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Route ID Mismatch",
                Detail = "The employee ID in the route URL does not match the command payload ID.",
                Instance = HttpContext.Request.Path
            });
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Deactivates / soft-deletes an employee staff record.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEmployee(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteEmployeeCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

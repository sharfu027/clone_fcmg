using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Application.Features.IAM.Commands.Admins;
using INK.ERP.Application.Features.IAM.Queries.Admins;

namespace INK.ERP.API.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admins")]
[Authorize(Roles = "Super Administrator")]
public sealed class AdminsController : BaseApiController
{
    /// <summary>
    /// Super Admin only: Creates a new Administrator user and assigns a Company in a single transaction.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAdmin(
        [FromBody] CreateAdminWithCompanyCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess)
        {
            return StatusCode(StatusCodes.Status201Created, new { id = result.Value });
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Super Admin only: Retrieves all Administrator users and their active Company assignments.
    /// </summary>
    [HttpGet("assignments")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminAssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminAssignments(CancellationToken cancellationToken = default)
    {
        var query = new GetAdminCompanyAssignmentsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Super Admin only: Assigns or reassigns a Company to an Administrator.
    /// </summary>
    [HttpPut("{id:guid}/company")]
    [HttpPost("{id:guid}/assign-company")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignCompany(
        [FromRoute] Guid id,
        [FromBody] AssignCompanyRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AssignCompanyToAdminCommand(id, request.CompanyId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Super Admin only: Revokes an Administrator's active Company assignment.
    /// </summary>
    [HttpDelete("{id:guid}/company")]
    [HttpPost("{id:guid}/revoke-company")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeCompany(
        [FromRoute] Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new RevokeAdminCompanyAssignmentCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Super Admin only: Retrieves the users and employees working under an Administrator's assigned Company.
    /// </summary>
    [HttpGet("{id:guid}/subordinates")]
    [ProducesResponseType(typeof(AdminTeamDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdminSubordinates(
        [FromRoute] Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminSubordinatesQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }
}

public sealed record AssignCompanyRequest(Guid CompanyId);

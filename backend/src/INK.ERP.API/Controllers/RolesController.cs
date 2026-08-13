using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.IAM.Commands.Roles;
using INK.ERP.Application.Features.IAM.DTOs;
using INK.ERP.Application.Features.IAM.Filters;
using INK.ERP.Application.Features.IAM.Queries.Roles;

namespace INK.ERP.API.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/roles")]
[Authorize]
public sealed class RolesController : BaseApiController
{
    /// <summary>
    /// Get paged list of roles with filtering and sorting.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Roles.Read")]
    [ProducesResponseType(typeof(PagedResult<RoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles([FromQuery] RoleFilter filter, CancellationToken cancellationToken)
    {
        var query = new GetRolesQuery(filter);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get summary metrics statistics for Role Security Profiles module.
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Policy = "IAM.Roles.Read")]
    [ProducesResponseType(typeof(RoleStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoleStats(CancellationToken cancellationToken)
    {
        var query = new GetRoleStatsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get all system permission categories & permissions matrix.
    /// </summary>
    [HttpGet("permissions/available")]
    [Authorize(Policy = "IAM.Roles.Read")]
    [ProducesResponseType(typeof(List<PermissionCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailablePermissions(CancellationToken cancellationToken)
    {
        var query = new GetAvailablePermissionsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get role details by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "IAM.Roles.Read")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoleById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetRoleByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new application role.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IAM.Roles.Manage")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return HandleCreatedResult(result, nameof(GetRoleById), new { id = result.IsSuccess ? result.Value : Guid.Empty });
    }

    /// <summary>
    /// Update existing application role.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "IAM.Roles.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateRoleCommand(id, request.Name, request.Description, request.Priority, request.IsActive);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Soft delete application role.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "IAM.Roles.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteRoleCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Activate role status.
    /// </summary>
    [HttpPatch("{id:guid}/activate")]
    [Authorize(Policy = "IAM.Roles.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ActivateRole(Guid id, CancellationToken cancellationToken)
    {
        var command = new ActivateRoleCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Deactivate role status.
    /// </summary>
    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Policy = "IAM.Roles.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeactivateRole(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeactivateRoleCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Clone existing role and copy all permission assignments.
    /// </summary>
    [HttpPost("{id:guid}/clone")]
    [Authorize(Policy = "IAM.Roles.Manage")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    public async Task<IActionResult> CloneRole(Guid id, [FromBody] CloneRoleRequest request, CancellationToken cancellationToken)
    {
        var command = new CloneRoleCommand(id, request.NewName, request.NewCode, request.Description);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleCreatedResult(result, nameof(GetRoleById), new { id = result.IsSuccess ? result.Value : Guid.Empty });
    }

    /// <summary>
    /// Get assigned permission IDs for a role.
    /// </summary>
    [HttpGet("{id:guid}/permissions")]
    [Authorize(Policy = "IAM.Roles.Read")]
    [ProducesResponseType(typeof(List<Guid>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRolePermissions(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetRolePermissionsQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Update permission assignments for a role.
    /// </summary>
    [HttpPut("{id:guid}/permissions")]
    [Authorize(Policy = "IAM.Roles.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateRolePermissions(Guid id, [FromBody] UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateRolePermissionsCommand(id, request.PermissionIds);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get users assigned to a role.
    /// </summary>
    [HttpGet("{id:guid}/users")]
    [Authorize(Policy = "IAM.Roles.Read")]
    [ProducesResponseType(typeof(List<RoleUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoleUsers(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetRoleUsersQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Remove user from a role.
    /// </summary>
    [HttpDelete("{id:guid}/users/{userId:guid}")]
    [Authorize(Policy = "IAM.Roles.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveUserFromRole(Guid id, Guid userId, CancellationToken cancellationToken)
    {
        var command = new RemoveUserFromRoleCommand(id, userId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

public record UpdateRoleRequest(string Name, string Description, int Priority, bool IsActive);

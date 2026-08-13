using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.IAM.Commands.Permissions;
using INK.ERP.Application.Features.IAM.DTOs;
using INK.ERP.Application.Features.IAM.Filters;
using INK.ERP.Application.Features.IAM.Queries.Permissions;

namespace INK.ERP.API.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/permissions")]
[Authorize]
public sealed class PermissionsController : BaseApiController
{
    /// <summary>
    /// Get paged list of permissions.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Permissions.Manage")]
    [ProducesResponseType(typeof(PagedResult<PermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPermissions([FromQuery] PermissionFilter filter, CancellationToken cancellationToken)
    {
        var query = new GetPermissionsQuery(filter);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get permission details by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "IAM.Permissions.Manage")]
    [ProducesResponseType(typeof(PermissionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPermissionById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetPermissionByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new permission.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IAM.Permissions.Manage")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreatePermission([FromBody] CreatePermissionCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return HandleCreatedResult(result, nameof(GetPermissionById), new { id = result.IsSuccess ? result.Value : Guid.Empty });
    }

    /// <summary>
    /// Update existing permission.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "IAM.Permissions.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdatePermission(Guid id, [FromBody] UpdatePermissionRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdatePermissionCommand(id, request.Name, request.Description, request.DisplayOrder, request.IsActive);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Soft delete permission.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "IAM.Permissions.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeletePermission(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeletePermissionCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

public record UpdatePermissionRequest(string Name, string Description, int DisplayOrder, bool IsActive);

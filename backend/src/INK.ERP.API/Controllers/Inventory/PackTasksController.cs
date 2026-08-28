using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Inventory.Fulfillment.Commands;
using INK.ERP.Application.Features.Inventory.Fulfillment.DTOs;
using INK.ERP.Application.Features.Inventory.Fulfillment.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory/packs")]
public class PackTasksController : BaseApiController
{
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(PackTaskDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePackTask([FromBody] CreatePackTaskCommand command, CancellationToken cancellationToken)
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
    [ProducesResponseType(typeof(IReadOnlyList<PackTaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPackTasks(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? salesOrderId,
        [FromQuery] Guid? pickTaskId,
        [FromQuery] Guid? employeeId,
        [FromQuery] string? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(new GetPackTasksPagedQuery(
            companyId, salesOrderId, pickTaskId, employeeId, status, fromDate, toDate, page, pageSize), cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PackTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPackTaskById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetPackTaskByIdQuery(id), cancellationToken);
        return HandleResult(result);
    }

    public record AssignPackerRequest(Guid EmployeeId);

    [HttpPost("{id:guid}/assign")]
    [Authorize]
    [ProducesResponseType(typeof(PackTaskDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignPacker(Guid id, [FromBody] AssignPackerRequest request, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new AssignPackerCommand(id, request.EmployeeId), cancellationToken);
        return HandleResult(result);
    }

    public record CompletePackTaskRequest(List<PackageInput> Packages);

    [HttpPost("{id:guid}/complete")]
    [Authorize]
    [ProducesResponseType(typeof(PackTaskDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CompletePackTask(Guid id, [FromBody] CompletePackTaskRequest? request, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new CompletePackTaskCommand(id, request?.Packages ?? new List<PackageInput>()), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(PackTaskDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelPackTask(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new CancelPackTaskCommand(id), cancellationToken);
        return HandleResult(result);
    }
}

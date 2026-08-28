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
[Route("api/v{version:apiVersion}/inventory/picks")]
public class PickTasksController : BaseApiController
{
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(PickTaskDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePickTask([FromBody] CreatePickTaskCommand command, CancellationToken cancellationToken)
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
    [ProducesResponseType(typeof(IReadOnlyList<PickTaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPickTasks(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? salesOrderId,
        [FromQuery] Guid? locationId,
        [FromQuery] Guid? employeeId,
        [FromQuery] string? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(new GetPickTasksPagedQuery(
            companyId, salesOrderId, locationId, employeeId, status, fromDate, toDate, page, pageSize), cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PickTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPickTaskById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetPickTaskByIdQuery(id), cancellationToken);
        return HandleResult(result);
    }

    public record AssignPickerRequest(Guid EmployeeId);

    [HttpPost("{id:guid}/assign")]
    [Authorize]
    [ProducesResponseType(typeof(PickTaskDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignPicker(Guid id, [FromBody] AssignPickerRequest request, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new AssignPickerCommand(id, request.EmployeeId), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/start")]
    [Authorize]
    [ProducesResponseType(typeof(PickTaskDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> StartPickTask(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new StartPickTaskCommand(id), cancellationToken);
        return HandleResult(result);
    }

    public record CompletePickTaskRequest(List<CompletePickTaskItemRequest>? LineVerifications);

    [HttpPost("{id:guid}/complete")]
    [Authorize]
    [ProducesResponseType(typeof(PickTaskDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CompletePickTask(Guid id, [FromBody] CompletePickTaskRequest? request, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new CompletePickTaskCommand(id, request?.LineVerifications ?? new List<CompletePickTaskItemRequest>()), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(PickTaskDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelPickTask(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new CancelPickTaskCommand(id), cancellationToken);
        return HandleResult(result);
    }
}

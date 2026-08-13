using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.API.Models;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Procurement.PurchaseRequisitions.Commands;
using INK.ERP.Application.Features.Procurement.PurchaseRequisitions.DTOs;
using INK.ERP.Application.Features.Procurement.PurchaseRequisitions.Queries;
using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.API.Controllers.Procurement;

public record RejectRequisitionRequest(string Reason);
public record CancelRequisitionRequest(string? Reason);
public record ApproveRequisitionRequest(string? Comment);

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/procurement/purchase-requisitions")]
public class PurchaseRequisitionController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of Purchase Requisitions with search and filter options.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(PagedResult<PurchaseRequisitionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPurchaseRequisitions(
        [FromQuery] Guid companyId,
        [FromQuery] SecurityFilterParameters filter,
        [FromQuery] RequisitionStatus? status,
        [FromQuery] RequisitionPriority? priority,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var query = new GetPurchaseRequisitionsPagedQuery(
            companyId,
            filter.Page,
            filter.PageSize,
            filter.Search,
            status,
            priority,
            fromDate,
            toDate);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Previews the next system-generated Purchase Requisition number (e.g. PR-2026-000001).
    /// </summary>
    [HttpGet("next-number")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextRequisitionNumber([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var query = new GetNextRequisitionNumberQuery(companyId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves real API metrics for Procurement Dashboard.
    /// </summary>
    [HttpGet("metrics")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(ProcurementMetricsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProcurementMetrics([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var query = new GetProcurementDashboardMetricsQuery(companyId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves detailed Purchase Requisition profile with line items and status timeline.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(PurchaseRequisitionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPurchaseRequisitionById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetPurchaseRequisitionByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new Purchase Requisition draft.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IAM.Users.Create")]
    [ProducesResponseType(typeof(PurchaseRequisitionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePurchaseRequisition([FromBody] CreatePurchaseRequisitionCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing Draft Purchase Requisition.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(PurchaseRequisitionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePurchaseRequisition(Guid id, [FromBody] UpdatePurchaseRequisitionCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Route ID Mismatch",
                Detail = "Requisition ID in route URL does not match command payload ID.",
                Instance = HttpContext.Request.Path
            });
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Soft deletes a Draft Purchase Requisition.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePurchaseRequisition(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeletePurchaseRequisitionCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Submits a Draft Purchase Requisition for approval (Transitions Draft -> PendingApproval).
    /// </summary>
    [HttpPost("{id:guid}/submit")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(PurchaseRequisitionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitPurchaseRequisition(Guid id, CancellationToken cancellationToken)
    {
        var command = new SubmitPurchaseRequisitionCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Approves a Purchase Requisition (Transitions PendingApproval -> Approved).
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(PurchaseRequisitionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ApprovePurchaseRequisition(Guid id, [FromBody] ApproveRequisitionRequest? request, CancellationToken cancellationToken)
    {
        var command = new ApprovePurchaseRequisitionCommand(id, request?.Comment);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Rejects a Purchase Requisition (Transitions PendingApproval -> Rejected).
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(PurchaseRequisitionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> RejectPurchaseRequisition(Guid id, [FromBody] RejectRequisitionRequest request, CancellationToken cancellationToken)
    {
        var command = new RejectPurchaseRequisitionCommand(id, request.Reason);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Cancels a Purchase Requisition (Transitions Draft or PendingApproval -> Cancelled).
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(PurchaseRequisitionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelPurchaseRequisition(Guid id, [FromBody] CancelRequisitionRequest? request, CancellationToken cancellationToken)
    {
        var command = new CancelPurchaseRequisitionCommand(id, request?.Reason);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

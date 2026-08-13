using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.API.Models;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Procurement.RFQs.Commands;
using INK.ERP.Application.Features.Procurement.RFQs.DTOs;
using INK.ERP.Application.Features.Procurement.RFQs.Queries;
using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.API.Controllers.Procurement;

public record CancelRfqRequest(string Reason);
public record CloseRfqRequest(string CloseReason);

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/procurement/rfqs")]
public class RfqController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of Request for Quotations (RFQs) with search and filter options.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(PagedResult<RfqDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRfqs(
        [FromQuery] Guid companyId,
        [FromQuery] SecurityFilterParameters filter,
        [FromQuery] RfqStatus? status,
        [FromQuery] Guid? supplierId,
        [FromQuery] Guid? purchaseRequisitionId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var query = new GetRfqsPagedQuery(
            companyId,
            filter.Page,
            filter.PageSize,
            filter.Search,
            status,
            supplierId,
            purchaseRequisitionId,
            fromDate,
            toDate);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Previews the next system-generated RFQ number (e.g. RFQ-2026-000001).
    /// </summary>
    [HttpGet("next-number")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextRfqNumber([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var query = new GetNextRfqNumberQuery(companyId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves RFQ module metrics for the specified company.
    /// </summary>
    [HttpGet("metrics")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(RfqMetricsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRfqMetrics([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var query = new GetRfqMetricsQuery(companyId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves RFQs associated with an Approved Purchase Requisition.
    /// </summary>
    [HttpGet("from-pr/{purchaseRequisitionId}")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(IReadOnlyList<RfqDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRfqsByPurchaseRequisition(Guid purchaseRequisitionId, CancellationToken cancellationToken)
    {
        var query = new GetRfqsByPurchaseRequisitionQuery(purchaseRequisitionId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single RFQ by ID.
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(RfqDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRfqById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetRfqByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new Draft RFQ from an Approved Purchase Requisition.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IAM.Users.Write")]
    [ProducesResponseType(typeof(RfqDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateRfq([FromBody] CreateRfqCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Updates a Draft RFQ.
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = "IAM.Users.Write")]
    [ProducesResponseType(typeof(RfqDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateRfq(Guid id, [FromBody] UpdateRfqCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(new { title = "Bad Request", status = 400, detail = "ID in route path does not match ID in request payload body." });
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Submits a Draft RFQ.
    /// </summary>
    [HttpPost("{id}/submit")]
    [Authorize(Policy = "IAM.Users.Write")]
    [ProducesResponseType(typeof(RfqDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitRfq(Guid id, CancellationToken cancellationToken)
    {
        var command = new SubmitRfqCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Sends a Submitted RFQ to recipient suppliers.
    /// </summary>
    [HttpPost("{id}/send")]
    [Authorize(Policy = "IAM.Users.Write")]
    [ProducesResponseType(typeof(RfqDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendRfq(Guid id, CancellationToken cancellationToken)
    {
        var command = new SendRfqCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Cancels a Draft or Submitted RFQ with reason.
    /// </summary>
    [HttpPost("{id}/cancel")]
    [Authorize(Policy = "IAM.Users.Write")]
    [ProducesResponseType(typeof(RfqDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelRfq(Guid id, [FromBody] CancelRfqRequest request, CancellationToken cancellationToken)
    {
        var command = new CancelRfqCommand(id, request.Reason);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Manually closes a Sent RFQ with close reason.
    /// </summary>
    [HttpPost("{id}/close")]
    [Authorize(Policy = "IAM.Users.Write")]
    [ProducesResponseType(typeof(RfqDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CloseRfq(Guid id, [FromBody] CloseRfqRequest request, CancellationToken cancellationToken)
    {
        var command = new CloseRfqCommand(id, request.CloseReason);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.SFA.Commands;
using INK.ERP.Application.Features.SFA.DTOs;
using INK.ERP.Application.Features.SFA.Queries;

namespace INK.ERP.API.Controllers.SFA;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sfa")]
[Authorize]
public class SfaController : BaseApiController
{
    // ==========================================
    // 1. SALES REPS
    // ==========================================
    [HttpGet("reps")]
    [ProducesResponseType(typeof(IReadOnlyList<SfaSalesRepDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesReps([FromQuery] Guid? companyId, [FromQuery] string? search, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetSfaSalesRepsQuery(companyId, search), cancellationToken);
        return HandleResult(result);
    }

    // ==========================================
    // 2. BEATS & ROUTES
    // ==========================================
    [HttpGet("beats")]
    [ProducesResponseType(typeof(IReadOnlyList<SalesBeatDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBeats([FromQuery] Guid? companyId, [FromQuery] Guid? salesEmployeeId, [FromQuery] string? search, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetSalesBeatsQuery(companyId, salesEmployeeId, search), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("beats")]
    [ProducesResponseType(typeof(SalesBeatDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateBeat([FromBody] CreateSalesBeatRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateSalesBeatCommand(
            request.CompanyId,
            request.Code,
            request.Name,
            request.SalesEmployeeId,
            request.Frequency,
            request.CustomerIds
        );
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
            return StatusCode(StatusCodes.Status201Created, result.Value);
        return HandleResult(result);
    }

    [HttpPut("beats/{id:guid}")]
    [ProducesResponseType(typeof(SalesBeatDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateBeat(Guid id, [FromBody] UpdateSalesBeatRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateSalesBeatCommand(
            id,
            request.Name,
            request.SalesEmployeeId,
            request.Frequency,
            request.IsActive,
            request.CustomerIds
        );
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("beats/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteBeat(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new DeleteSalesBeatCommand(id), cancellationToken);
        return HandleResult(result);
    }

    // ==========================================
    // 3. CUSTOMER ASSIGNMENTS
    // ==========================================
    [HttpGet("customer-assignments")]
    [ProducesResponseType(typeof(IReadOnlyList<SalesRepCustomerAssignmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomerAssignments([FromQuery] Guid? companyId, [FromQuery] Guid? employeeId, [FromQuery] Guid? customerId, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetCustomerAssignmentsQuery(companyId, employeeId, customerId), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("customer-assignments")]
    [ProducesResponseType(typeof(SalesRepCustomerAssignmentDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> AssignCustomer([FromBody] AssignCustomerRequest request, CancellationToken cancellationToken)
    {
        var command = new AssignCustomerToRepCommand(
            request.CompanyId,
            request.EmployeeId,
            request.CustomerId,
            request.AssignedFromUtc,
            request.AssignedToUtc
        );
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
            return StatusCode(StatusCodes.Status201Created, result.Value);
        return HandleResult(result);
    }

    [HttpDelete("customer-assignments/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveCustomerAssignment(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new RemoveCustomerAssignmentCommand(id), cancellationToken);
        return HandleResult(result);
    }

    // ==========================================
    // 4. STORE VISITS & GPS CHECK-IN
    // ==========================================
    [HttpGet("visits")]
    [ProducesResponseType(typeof(IReadOnlyList<SalesVisitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisits(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? salesEmployeeId,
        [FromQuery] Guid? customerId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? outcome,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetSalesVisitsQuery(companyId, salesEmployeeId, customerId, fromDate, toDate, outcome), cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("visits/checkin")]
    [ProducesResponseType(typeof(SalesVisitDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CheckInVisit([FromBody] CheckInVisitRequest request, CancellationToken cancellationToken)
    {
        var command = new CheckInStoreVisitCommand(
            request.CompanyId,
            request.CustomerId,
            request.SalesEmployeeId,
            request.Latitude,
            request.Longitude,
            request.AccuracyMeters,
            request.IsFaceVerified,
            request.Notes
        );
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
            return StatusCode(StatusCodes.Status201Created, result.Value);
        return HandleResult(result);
    }

    [HttpPost("visits/{id:guid}/checkout")]
    [ProducesResponseType(typeof(SalesVisitDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckOutVisit(Guid id, [FromBody] CheckOutVisitRequest request, CancellationToken cancellationToken)
    {
        var command = new CheckOutStoreVisitCommand(id, request.Outcome, request.Notes);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // ==========================================
    // 5. DASHBOARD METRICS
    // ==========================================
    [HttpGet("dashboard/metrics")]
    [ProducesResponseType(typeof(SfaDashboardMetricsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardMetrics([FromQuery] Guid? companyId, [FromQuery] Guid? salesEmployeeId, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetSfaDashboardMetricsQuery(companyId, salesEmployeeId), cancellationToken);
        return HandleResult(result);
    }
}

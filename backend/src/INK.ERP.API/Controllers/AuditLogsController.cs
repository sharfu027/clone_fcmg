using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.IAM.DTOs;
using INK.ERP.Application.Features.IAM.Filters;
using INK.ERP.Application.Features.IAM.Queries.AuditLogs;

namespace INK.ERP.API.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/audit-logs")]
[Authorize]
public sealed class AuditLogsController : BaseApiController
{
    /// <summary>
    /// Get paged audit logs with comprehensive filtering and searching.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Audit.Read")]
    [ProducesResponseType(typeof(PagedResult<AuditLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogFilter filter, CancellationToken cancellationToken)
    {
        var query = new GetAuditLogsQuery(filter);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get audit log statistics and metrics summary.
    /// </summary>
    [HttpGet("statistics")]
    [Authorize(Policy = "IAM.Audit.Read")]
    [ProducesResponseType(typeof(AuditLogStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogStatistics(CancellationToken cancellationToken)
    {
        var query = new GetAuditLogStatsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get audit log event details by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "IAM.Audit.Read")]
    [ProducesResponseType(typeof(AuditLogDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuditLogById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetAuditLogByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Export filtered audit log records to CSV or PDF file.
    /// </summary>
    [HttpPost("export")]
    [Authorize(Policy = "IAM.Audit.Read")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportAuditLogs([FromBody] ExportAuditLogsRequest request, CancellationToken cancellationToken)
    {
        var filter = new AuditLogFilter
        {
            SearchTerm = request.SearchTerm,
            Category = request.Category,
            EventType = request.EventType,
            Module = request.Module,
            Result = request.Result,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            PageNumber = 1,
            PageSize = 10000 // Export all matching
        };

        var query = new ExportAuditLogsQuery(filter, request.Format ?? "csv");
        var result = await Mediator.Send(query, cancellationToken);
        if (result.IsFailure) return HandleResult(result);

        return File(result.Value.FileBytes, result.Value.ContentType, result.Value.FileName);
    }
}

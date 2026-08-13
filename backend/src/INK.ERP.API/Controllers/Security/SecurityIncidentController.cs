using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Models;
using INK.ERP.Application.Features.Security.Incidents;
using INK.ERP.Application.Features.Security.Incidents.DTOs;
using INK.ERP.Domain.Enums.Security;

namespace INK.ERP.API.Controllers.Security;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/security/incident")]
public class SecurityIncidentController : BaseApiController
{
    /// <summary>
    /// Retrieves open security incidents with standardized filtering (severity, date range, search, sort), pagination, and X-Pagination header.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "Security.Risk.View")]
    [ProducesResponseType(typeof(IReadOnlyList<SecurityIncidentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIncidents([FromQuery] Guid? userId, [FromQuery] SecurityFilterParameters filter, CancellationToken cancellationToken)
    {
        var query = new GetOpenIncidentsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            var incidents = result.Value.AsQueryable();

            if (userId.HasValue)
            {
                incidents = incidents.Where(i => i.UserId == userId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Severity))
            {
                incidents = incidents.Where(i => string.Equals(i.Severity, filter.Severity, StringComparison.OrdinalIgnoreCase));
            }

            if (filter.StartDate.HasValue)
            {
                incidents = incidents.Where(i => i.CreatedAtUtc >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                incidents = incidents.Where(i => i.CreatedAtUtc <= filter.EndDate.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                incidents = incidents.Where(i => i.Description.Contains(filter.Search, StringComparison.OrdinalIgnoreCase) || i.Type.Contains(filter.Search, StringComparison.OrdinalIgnoreCase));
            }

            int totalCount = incidents.Count();
            var pagedIncidents = incidents.Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize).ToList();
            int totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize);

            var paginationMetadata = new PaginationMetadata(totalCount, filter.PageSize, filter.Page, totalPages);
            Response.Headers["X-Pagination"] = JsonSerializer.Serialize(paginationMetadata);

            return Ok(pagedIncidents);
        }

        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves details for a specific security incident by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Security.Risk.View")]
    [ProducesResponseType(typeof(SecurityIncidentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIncidentById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetIncidentQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Manually raises a new security incident report. Supports Idempotency-Key.
    /// </summary>
    [HttpPost("raise")]
    [Authorize(Policy = "Security.Risk.View")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Raise([FromBody] RaiseSecurityIncidentCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Resolves an active security incident with investigation resolution notes.
    /// </summary>
    [HttpPost("resolve")]
    [Authorize(Policy = "Security.Risk.View")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Resolve([FromBody] ResolveSecurityIncidentCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves all unresolved critical-severity security incidents.
    /// </summary>
    [HttpGet("critical")]
    [Authorize(Policy = "Security.Risk.View")]
    [ProducesResponseType(typeof(IReadOnlyList<SecurityIncidentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCriticalIncidents(CancellationToken cancellationToken)
    {
        var query = new GetOpenIncidentsQuery(IncidentSeverity.Critical);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }
}

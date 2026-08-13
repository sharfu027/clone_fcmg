using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using INK.ERP.Application.Features.Security.Risk;
using INK.ERP.Application.Features.Security.Risk.DTOs;

namespace INK.ERP.API.Controllers.Security;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/security/risk")]
[EnableRateLimiting("RiskPolicy")]
public class RiskController : BaseApiController
{
    /// <summary>
    /// Evaluates current security risk score (0-100) and risk level for a authentication context payload.
    /// </summary>
    [HttpPost("calculate")]
    [Authorize(Policy = "Security.Risk.View")]
    [ProducesResponseType(typeof(RiskAssessmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Calculate([FromBody] CalculateRiskQuery query, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves historical risk score assessment for a specific user.
    /// </summary>
    [HttpGet("user/{userId:guid}")]
    [Authorize(Policy = "Security.Risk.View")]
    [ProducesResponseType(typeof(RiskAssessmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserRisk(Guid userId, CancellationToken cancellationToken)
    {
        var query = new CalculateRiskQuery(userId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves system-wide security risk telemetry and risk distribution statistics.
    /// </summary>
    [HttpGet("statistics")]
    [Authorize(Policy = "Security.Risk.View")]
    [ProducesResponseType(typeof(RiskAssessmentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var query = new CalculateRiskQuery(Guid.Empty);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }
}

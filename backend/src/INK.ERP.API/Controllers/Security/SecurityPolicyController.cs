using Asp.Versioning;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Application.Features.Security.Policies;
using INK.ERP.Application.Features.Security.Policies.DTOs;

namespace INK.ERP.API.Controllers.Security;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/security/policy")]
public class SecurityPolicyController : BaseApiController
{
    /// <summary>
    /// Resolves the effective security policy for a specific user (global policy + user overrides).
    /// Supports ETag and Response Caching.
    /// </summary>
    [HttpGet("effective")]
    [Authorize(Policy = "Security.Policy.Manage")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "userId" })]
    [ProducesResponseType(typeof(EffectiveSecurityPolicyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEffectivePolicy([FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        var query = new GetEffectiveSecurityPolicyQuery(userId);
        var result = await Mediator.Send(query, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            var etag = CalculateETag(result.Value);
            Response.Headers.ETag = etag;
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates system-wide global security policy settings with Optimistic Concurrency (If-Match ETag validation).
    /// </summary>
    [HttpPut("global")]
    [Authorize(Policy = "Security.Policy.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status412PreconditionFailed)]
    public async Task<IActionResult> UpdateGlobalPolicy([FromBody] UpdateGlobalSecurityPolicyCommand command, CancellationToken cancellationToken)
    {
        var currentQuery = new GetGlobalSecurityPolicyQuery();
        var currentResult = await Mediator.Send(currentQuery, cancellationToken);
        if (currentResult.IsSuccess && currentResult.Value != null)
        {
            var currentEtag = CalculateETag(currentResult.Value);
            if (Request.Headers.TryGetValue("If-Match", out var ifMatch) && ifMatch != currentEtag)
            {
                return StatusCode(StatusCodes.Status412PreconditionFailed, new ProblemDetails
                {
                    Status = StatusCodes.Status412PreconditionFailed,
                    Title = "Precondition Failed",
                    Detail = "The security policy has been modified by another administrator since you fetched it. Please refresh and try again.",
                    Instance = HttpContext.Request.Path
                });
            }
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Configures user-level security policy overrides with Optimistic Concurrency.
    /// </summary>
    [HttpPut("user")]
    [Authorize(Policy = "Security.Policy.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status412PreconditionFailed)]
    public async Task<IActionResult> UpdateUserPolicy([FromBody] UpdateUserSecurityPolicyCommand command, CancellationToken cancellationToken)
    {
        var currentQuery = new GetEffectiveSecurityPolicyQuery(command.UserId);
        var currentResult = await Mediator.Send(currentQuery, cancellationToken);
        if (currentResult.IsSuccess && currentResult.Value != null)
        {
            var currentEtag = CalculateETag(currentResult.Value);
            if (Request.Headers.TryGetValue("If-Match", out var ifMatch) && ifMatch != currentEtag)
            {
                return StatusCode(StatusCodes.Status412PreconditionFailed, new ProblemDetails
                {
                    Status = StatusCodes.Status412PreconditionFailed,
                    Title = "Precondition Failed",
                    Detail = "The user security policy has been modified by another administrator. Please refresh and try again.",
                    Instance = HttpContext.Request.Path
                });
            }
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves active global security policy details with ETag caching.
    /// </summary>
    [HttpGet("history")]
    [Authorize(Policy = "Security.Policy.Manage")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType(typeof(SecurityPolicyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPolicyHistory(CancellationToken cancellationToken)
    {
        var query = new GetGlobalSecurityPolicyQuery();
        var result = await Mediator.Send(query, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            var etag = CalculateETag(result.Value);
            Response.Headers.ETag = etag;
        }
        return HandleResult(result);
    }

    private static string CalculateETag(object obj)
    {
        var json = JsonSerializer.Serialize(obj);
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(json));
        return $"\"W/{BitConverter.ToString(hash).Replace("-", "").Substring(0, 16)}\"";
    }
}

using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Security.Dashboard.DTOs;
using INK.ERP.Application.Features.Security.Dashboard.Queries;

namespace INK.ERP.API.Controllers.Security;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/security/dashboard")]
[Authorize]
public class SecurityDashboardController : BaseApiController
{
    /// <summary>
    /// Retrieves aggregated real-time security control dashboard summary metrics.
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Policy = "IAM.Audit.Read")]
    [ProducesResponseType(typeof(SecurityDashboardSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var query = new GetSecurityDashboardSummaryQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }
}

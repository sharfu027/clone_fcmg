using System;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Security.Pins.Commands;
using INK.ERP.Application.Features.Security.Pins.DTOs;

namespace INK.ERP.API.Controllers.Security;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/security/pins")]
public class SecurityPinsController : BaseApiController
{
    [HttpPost("generate")]
    [Authorize]
    [ProducesResponseType(typeof(TemporaryPinDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GeneratePin([FromBody] GenerateTemporaryPinRequest request, CancellationToken cancellationToken)
    {
        var command = new GenerateTemporaryPinCommand(
            request.CompanyId, request.EmployeeId, request.Purpose, request.ExpiryMinutes);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ValidateTemporaryPinResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidatePin([FromBody] ValidateTemporaryPinRequest request, CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var command = new ValidateTemporaryPinCommand(
            request.CompanyId, request.Pin, request.EmployeeId, request.DeviceId, clientIp);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("validate-location")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ValidateLoginLocationResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateLocation([FromBody] ValidateLoginLocationRequest request, CancellationToken cancellationToken)
    {
        var command = new ValidateLoginLocationCommand(
            request.CompanyId, request.EmployeeId, request.Latitude, request.Longitude, request.AccuracyMeters, request.MaxAllowedRadiusMeters);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

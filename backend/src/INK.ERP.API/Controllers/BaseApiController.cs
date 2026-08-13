using MediatR;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Domain.Common;
using System.Diagnostics;

namespace INK.ERP.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;

    protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected IActionResult HandleResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
        {
            if (result.Value is null || result.Value is Unit)
            {
                return NoContent();
            }

            return Ok(result.Value);
        }

        return MapErrorToProblemDetails(result.Error);
    }

    protected IActionResult HandleResult(Result result)
    {
        if (result.IsSuccess)
        {
            return NoContent();
        }

        return MapErrorToProblemDetails(result.Error);
    }

    protected IActionResult HandleCreatedResult<T>(Result<T> result, string actionName, object? routeValues)
    {
        if (result.IsSuccess)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }

        return MapErrorToProblemDetails(result.Error);
    }

    protected IActionResult MapErrorToProblemDetails(Error error)
    {
        var statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status400BadRequest
        };

        var traceId = Activity.Current?.Id ?? HttpContext.TraceIdentifier;
        var correlationId = HttpContext.Items["X-Correlation-ID"]?.ToString()
            ?? HttpContext.Response.Headers["X-Correlation-ID"].ToString()
            ?? Guid.NewGuid().ToString();

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(error.Type),
            Detail = error.Description,
            Type = GetTypeUrl(statusCode),
            Instance = HttpContext.Request.Path
        };

        problemDetails.Extensions["errorCode"] = error.Code;
        problemDetails.Extensions["traceId"] = traceId;
        problemDetails.Extensions["correlationId"] = correlationId;
        problemDetails.Extensions["timestamp"] = DateTime.UtcNow.ToString("o");

        return StatusCode(statusCode, problemDetails);
    }

    private static string GetTitle(ErrorType errorType) => errorType switch
    {
        ErrorType.Validation => "Bad Request / Validation Error",
        ErrorType.NotFound => "Resource Not Found",
        ErrorType.Conflict => "Resource Conflict",
        ErrorType.Unauthorized => "Unauthorized Access",
        _ => "An error occurred"
    };

    private static string GetTypeUrl(int statusCode) => statusCode switch
    {
        400 => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
        401 => "https://tools.ietf.org/html/rfc7235#section-3.1",
        403 => "https://tools.ietf.org/html/rfc7231#section-6.5.3",
        404 => "https://tools.ietf.org/html/rfc7231#section-6.5.4",
        409 => "https://tools.ietf.org/html/rfc7231#section-6.5.8",
        422 => "https://tools.ietf.org/html/rfc4918#section-11.2",
        _ => "https://tools.ietf.org/html/rfc7231#section-6.6.1"
    };
}

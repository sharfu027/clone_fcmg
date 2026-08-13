using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using INK.ERP.Application.Common.Exceptions;

namespace INK.ERP.API.Middleware;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Unhandled Exception Occurred: {Message}", exception.Message);

        var problemDetails = new ProblemDetails
        {
            Instance = httpContext.Request.Path
        };

        if (exception is ValidationException validationException)
        {
            problemDetails.Status = StatusCodes.Status400BadRequest;
            problemDetails.Title = "Validation Error";
            problemDetails.Detail = validationException.Message;
            problemDetails.Extensions.Add("errors", validationException.Errors);
        }
        else if (exception is DbUpdateException dbUpdateEx && dbUpdateEx.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
        {
            problemDetails.Status = StatusCodes.Status409Conflict;
            problemDetails.Title = "Duplicate Record Conflict";

            var constraint = pgEx.ConstraintName ?? string.Empty;
            if (constraint.Contains("TaxRegistrationNumber", StringComparison.OrdinalIgnoreCase))
            {
                problemDetails.Detail = "A company with this Tax Registration (GSTIN) already exists.";
            }
            else if (constraint.Contains("Code", StringComparison.OrdinalIgnoreCase))
            {
                problemDetails.Detail = "A record with this Code identifier already exists.";
            }
            else if (constraint.Contains("LegalName", StringComparison.OrdinalIgnoreCase))
            {
                problemDetails.Detail = "A record with this Legal Name already exists.";
            }
            else
            {
                problemDetails.Detail = "A record with these unique details already exists in the system.";
            }
        }
        else
        {
            problemDetails.Status = StatusCodes.Status500InternalServerError;
            problemDetails.Title = "Internal Server Error";
            problemDetails.Detail = exception.Message;
        }

        httpContext.Response.StatusCode = problemDetails.Status.Value;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}

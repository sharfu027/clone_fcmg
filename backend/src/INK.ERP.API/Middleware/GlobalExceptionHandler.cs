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
        else if (exception is DbUpdateException dbUpdateEx && dbUpdateEx.InnerException is PostgresException pgEx)
        {
            if (pgEx.SqlState == "23505")
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
            else if (pgEx.SqlState == "23503")
            {
                problemDetails.Status = StatusCodes.Status409Conflict;
                problemDetails.Title = "Record In Use Conflict";

                var constraint = pgEx.ConstraintName ?? string.Empty;
                if (constraint.Contains("employees", StringComparison.OrdinalIgnoreCase) || constraint.Contains("designation", StringComparison.OrdinalIgnoreCase))
                {
                    problemDetails.Detail = "Cannot delete this record because it is currently referenced by one or more employee records.";
                }
                else if (constraint.Contains("branch", StringComparison.OrdinalIgnoreCase))
                {
                    problemDetails.Detail = "Cannot delete this record because it is currently referenced by one or more branch records.";
                }
                else if (constraint.Contains("department", StringComparison.OrdinalIgnoreCase))
                {
                    problemDetails.Detail = "Cannot delete this record because it is currently referenced by one or more department records.";
                }
                else if (constraint.Contains("company", StringComparison.OrdinalIgnoreCase))
                {
                    problemDetails.Detail = "Cannot delete this record because it is currently referenced by one or more company records.";
                }
                else
                {
                    problemDetails.Detail = "Cannot delete this record because it is currently referenced by other active records in the system.";
                }
            }
            else
            {
                problemDetails.Status = StatusCodes.Status400BadRequest;
                problemDetails.Title = "Database Operation Error";
                problemDetails.Detail = "A database constraint violation occurred while processing your request.";
            }
        }
        else if (exception is DbUpdateConcurrencyException concurrencyEx)
        {
            var entriesInfo = string.Join("; ", concurrencyEx.Entries.Select(e =>
                $"Entity: {e.Entity.GetType().Name}, State: {e.State}, Keys: [{string.Join(", ", e.Properties.Where(p => p.Metadata.IsPrimaryKey()).Select(p => $"{p.Metadata.Name}={p.CurrentValue}"))}]"));
            _logger.LogError(concurrencyEx, "DbUpdateConcurrencyException Details: {EntriesInfo}", entriesInfo);

            problemDetails.Status = StatusCodes.Status500InternalServerError;
            problemDetails.Title = "Database Operation Error";
            problemDetails.Detail = "An unexpected error occurred while saving database changes. Please try again or contact support.";
        }
        else if (exception is DbUpdateException dbUpdateExGeneric)
        {
            var entriesInfo = string.Join("; ", dbUpdateExGeneric.Entries.Select(e =>
                $"Entity: {e.Entity.GetType().Name}, State: {e.State}"));
            _logger.LogError(dbUpdateExGeneric, "DbUpdateException Details: {EntriesInfo} | Inner: {InnerMessage}",
                entriesInfo, dbUpdateExGeneric.InnerException?.Message);

            problemDetails.Status = StatusCodes.Status500InternalServerError;
            problemDetails.Title = "Database Operation Error";
            problemDetails.Detail = "An unexpected error occurred while saving database changes. Please try again or contact support.";
        }
        else
        {
            problemDetails.Status = StatusCodes.Status500InternalServerError;
            problemDetails.Title = "Internal Server Error";
            problemDetails.Detail = "An unexpected server error occurred.";
        }

        httpContext.Response.StatusCode = problemDetails.Status.Value;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}

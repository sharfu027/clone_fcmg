using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Application.Common.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;
    private readonly ICurrentUserService _currentUserService;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger, ICurrentUserService currentUserService)
    {
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var userId = _currentUserService.UserId ?? "Anonymous";

        _logger.LogInformation("Executing MediatR Request: {Name} for User: {UserId}", requestName, userId);

        try
        {
            var response = await next();
            _logger.LogInformation("Successfully Executed MediatR Request: {Name} for User: {UserId}", requestName, userId);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed Execution of MediatR Request: {Name} for User: {UserId} with Error: {Message}", requestName, userId, ex.Message);
            throw;
        }
    }
}

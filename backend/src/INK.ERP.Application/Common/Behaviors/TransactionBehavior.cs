using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Application.Common.Behaviors;

public sealed class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<TransactionBehavior<TRequest, TResponse>> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public TransactionBehavior(ILogger<TransactionBehavior<TRequest, TResponse>> logger, IUnitOfWork unitOfWork)
    {
        _logger = logger;
        _unitOfWork = unitOfWork;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        // Check if the request is a Command
        var isCommand = request is ICommand || 
                        request.GetType().GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ICommand<>));

        if (!isCommand)
        {
            return await next();
        }

        var requestName = typeof(TRequest).Name;

        try
        {
            _logger.LogInformation("Beginning Database Transaction for Request: {Name}", requestName);
            return await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var response = await next();
                _logger.LogInformation("Committed Database Transaction for Request: {Name}", requestName);
                return response;
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database Transaction failed for Request: {Name}", requestName);
            throw;
        }
    }
}

using System.Reflection;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Security;

namespace INK.ERP.Application.Common.Behaviors;

public sealed class AuthorizationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICurrentUserService _currentUserService;

    public AuthorizationBehavior(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var authorizeAttributes = request.GetType().GetCustomAttributes<AuthorizeAttribute>().ToList();

        if (authorizeAttributes.Count == 0)
        {
            return await next();
        }

        if (!_currentUserService.IsAuthenticated)
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }

        // Roles validation
        var authorizeRoles = authorizeAttributes
            .Where(a => !string.IsNullOrEmpty(a.Roles))
            .Select(a => a.Roles.Split(','));

        if (authorizeRoles.Any())
        {
            var authorized = false;
            foreach (var roles in authorizeRoles)
            {
                if (roles.Any(role => _currentUserService.Roles.Contains(role.Trim())))
                {
                    authorized = true;
                    break;
                }
            }

            if (!authorized)
            {
                throw new UnauthorizedAccessException("User is not authorized to access this resource.");
            }
        }

        return await next();
    }
}

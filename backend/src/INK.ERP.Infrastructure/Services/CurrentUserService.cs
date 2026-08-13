using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Services;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

    public string? Username => _httpContextAccessor.HttpContext?.User?.Identity?.Name;

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public IReadOnlyList<string> Roles => _httpContextAccessor.HttpContext?.User?
        .FindAll(ClaimTypes.Role)
        .Select(c => c.Value)
        .ToList() ?? new List<string>();

    public IReadOnlyList<string> Permissions => _httpContextAccessor.HttpContext?.User?
        .FindAll("permission")
        .Select(c => c.Value)
        .ToList() ?? new List<string>();

    public string? CorrelationId => _httpContextAccessor.HttpContext?.Request.Headers["X-Correlation-ID"].FirstOrDefault()
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("correlation_id");

    public IReadOnlyList<Claim> Claims => _httpContextAccessor.HttpContext?.User?.Claims.ToList() ?? new List<Claim>();
}

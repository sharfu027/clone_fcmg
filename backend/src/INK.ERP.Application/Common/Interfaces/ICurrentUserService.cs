using System.Security.Claims;

namespace INK.ERP.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Username { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
    IReadOnlyList<string> Permissions { get; }
    string? CorrelationId { get; }
    IReadOnlyList<Claim> Claims { get; }
}

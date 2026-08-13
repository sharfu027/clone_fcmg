using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<string?> GetUserNameAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> IsInRoleAsync(Guid userId, string role, CancellationToken cancellationToken = default);
    Task<bool> AuthorizeAsync(Guid userId, string policyName, CancellationToken cancellationToken = default);
    Task<Result> DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default);
}

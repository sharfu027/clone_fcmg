using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Application.Common.Interfaces;

public interface IPermissionRepository : IGenericRepository<Permission>
{
    Task<IReadOnlyList<Permission>> GetPermissionsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface IRefreshTokenRepository : IGenericRepository<RefreshToken>
{
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task RevokeFamilyAsync(string familyId, string reason, string revokedByIp, CancellationToken cancellationToken = default);
}

public interface IUserSessionRepository : IGenericRepository<UserSession>
{
    Task<UserSession?> GetByJwtIdAsync(string jwtId, CancellationToken cancellationToken = default);
}

public interface ILoginHistoryRepository : IGenericRepository<LoginHistory>
{
}

public interface ISecurityAuditRepository : IGenericRepository<SecurityAuditLog>
{
}

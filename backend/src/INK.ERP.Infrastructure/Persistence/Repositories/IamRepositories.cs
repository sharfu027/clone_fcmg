using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Specifications;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public class UserRepository : GenericRepository<ApplicationUser>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<ApplicationUser>> ListWithDeletedAsync(ISpecification<ApplicationUser> spec, CancellationToken cancellationToken = default)
    {
        return await Specifications.SpecificationEvaluator<ApplicationUser>.GetQuery(_dbSet.IgnoreQueryFilters().AsQueryable(), spec).ToListAsync(cancellationToken);
    }

    public async Task<int> CountWithDeletedAsync(ISpecification<ApplicationUser> spec, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.IgnoreQueryFilters().AsQueryable();
        if (spec.Criteria != null)
        {
            query = query.Where(spec.Criteria);
        }
        return await query.CountAsync(cancellationToken);
    }
}

public class RoleRepository : GenericRepository<ApplicationRole>, IRoleRepository
{
    public RoleRepository(AppDbContext context) : base(context)
    {
    }
}

public class PermissionRepository : GenericRepository<Permission>, IPermissionRepository
{
    public PermissionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Permission>> GetPermissionsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var roleIds = await _context.IAMUserRoles
            .Where(ur => ur.UserId == userId && !ur.IsDeleted)
            .Select(ur => ur.RoleId)
            .ToListAsync(cancellationToken);

        var permissionIds = await _context.RolePermissions
            .Where(rp => roleIds.Contains(rp.RoleId) && !rp.IsDeleted)
            .Select(rp => rp.PermissionId)
            .ToListAsync(cancellationToken);

        return await _dbSet
            .Where(p => permissionIds.Contains(p.Id) && !p.IsDeleted && p.IsActive)
            .ToListAsync(cancellationToken);
    }
}

public class RefreshTokenRepository : GenericRepository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(r => r.Token == token && !r.IsDeleted, cancellationToken);
    }

    public async Task RevokeFamilyAsync(string familyId, string reason, string revokedByIp, CancellationToken cancellationToken = default)
    {
        var tokens = await _dbSet.Where(r => r.FamilyId == familyId && r.RevokedUtc == null && !r.IsDeleted).ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;

        foreach (var t in tokens)
        {
            t.RevokedUtc = now;
            t.RevokedByIp = revokedByIp;
            t.ReasonRevoked = reason;
            t.LastModifiedAtUtc = now;
        }
    }
}

public class UserSessionRepository : GenericRepository<UserSession>, IUserSessionRepository
{
    public UserSessionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<UserSession?> GetByJwtIdAsync(string jwtId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(s => s.JwtId == jwtId && !s.IsDeleted, cancellationToken);
    }
}

public class LoginHistoryRepository : GenericRepository<LoginHistory>, ILoginHistoryRepository
{
    public LoginHistoryRepository(AppDbContext context) : base(context)
    {
    }
}

public class SecurityAuditRepository : GenericRepository<SecurityAuditLog>, ISecurityAuditRepository
{
    public SecurityAuditRepository(AppDbContext context) : base(context)
    {
    }
}

using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Security;

public interface ICacheInvalidationService
{
    Task InvalidateUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task InvalidateRolePermissionsAsync(Guid roleId, CancellationToken cancellationToken = default);
    Task InvalidateAllCacheAsync(CancellationToken cancellationToken = default);
}

public class PermissionResolver : IPermissionResolver, ICacheInvalidationService
{
    private readonly AppDbContext _context;
    private readonly ICacheService _cacheService;

    public PermissionResolver(AppDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<IReadOnlyList<string>> GetPermissionsForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"iam:permissions:user:{userId}";
        var cachedPermissions = await _cacheService.GetAsync<List<string>>(cacheKey, cancellationToken);
        if (cachedPermissions != null)
        {
            return cachedPermissions;
        }

        var roleIds = await _context.IAMUserRoles
            .Where(ur => ur.UserId == userId && !ur.IsDeleted)
            .Select(ur => ur.RoleId)
            .ToListAsync(cancellationToken);

        var permissionCodes = await _context.RolePermissions
            .Where(rp => roleIds.Contains(rp.RoleId) && !rp.IsDeleted)
            .Join(_context.Permissions.Where(p => !p.IsDeleted && p.IsActive),
                rp => rp.PermissionId,
                p => p.Id,
                (rp, p) => p.Code)
            .Distinct()
            .ToListAsync(cancellationToken);

        await _cacheService.SetAsync(cacheKey, permissionCodes, TimeSpan.FromMinutes(30), cancellationToken);

        return permissionCodes;
    }

    public async Task<bool> HasPermissionAsync(Guid userId, string permissionCode, CancellationToken cancellationToken = default)
    {
        var userPermissions = await GetPermissionsForUserAsync(userId, cancellationToken);
        return userPermissions.Contains(permissionCode, StringComparer.OrdinalIgnoreCase);
    }

    public async Task InvalidateUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"iam:permissions:user:{userId}";
        await _cacheService.RemoveAsync(cacheKey, cancellationToken);
    }

    public async Task InvalidateRolePermissionsAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        var userIds = await _context.IAMUserRoles
            .Where(ur => ur.RoleId == roleId && !ur.IsDeleted)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var userId in userIds)
        {
            await InvalidateUserPermissionsAsync(userId, cancellationToken);
        }
    }

    public async Task InvalidateAllCacheAsync(CancellationToken cancellationToken = default)
    {
        var userIds = await _context.Users.Select(u => u.Id).ToListAsync(cancellationToken);
        foreach (var userId in userIds)
        {
            await InvalidateUserPermissionsAsync(userId, cancellationToken);
        }
    }
}

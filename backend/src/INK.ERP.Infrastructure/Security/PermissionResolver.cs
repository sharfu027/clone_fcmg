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

        // Normalize permission dependencies:
        // 1. Company Master cascading hierarchy: Branch -> Warehouse/Stockist -> Department
        // 2. Product Master cascading dependency: Category/Brand/UOM -> Products
        bool hasManageAll = permissionCodes.Any(p => p.Equals("manage:all", StringComparison.OrdinalIgnoreCase));
        
        // Company Master cascade
        bool hasBranch = hasManageAll || permissionCodes.Any(p => p.Equals("masters:branch", StringComparison.OrdinalIgnoreCase));
        bool hasWarehouse = hasBranch || permissionCodes.Any(p => p.Equals("masters:warehouse", StringComparison.OrdinalIgnoreCase));
        bool hasDepartment = hasWarehouse || permissionCodes.Any(p => p.Equals("masters:department", StringComparison.OrdinalIgnoreCase));

        // Product Master cascade (Category/Brand/Unit -> Product)
        bool hasCategory = hasManageAll || permissionCodes.Any(p => p.Equals("masters:category", StringComparison.OrdinalIgnoreCase));
        bool hasBrand = hasManageAll || permissionCodes.Any(p => p.Equals("masters:brand", StringComparison.OrdinalIgnoreCase));
        bool hasUnit = hasManageAll || permissionCodes.Any(p => p.Equals("masters:unit", StringComparison.OrdinalIgnoreCase) || p.Equals("masters:uom", StringComparison.OrdinalIgnoreCase));
        bool hasProduct = hasCategory || hasBrand || hasUnit || permissionCodes.Any(p => p.Equals("masters:product", StringComparison.OrdinalIgnoreCase));

        var normalizedCodes = new HashSet<string>(permissionCodes, StringComparer.OrdinalIgnoreCase);

        if (hasBranch)
        {
            normalizedCodes.Add("masters:branch");
            normalizedCodes.Add("masters:warehouse");
            normalizedCodes.Add("masters:department");
        }
        else if (hasWarehouse)
        {
            normalizedCodes.Add("masters:warehouse");
            normalizedCodes.Add("masters:department");
        }
        else if (hasDepartment)
        {
            normalizedCodes.Add("masters:department");
        }

        if (hasCategory) normalizedCodes.Add("masters:category");
        if (hasBrand) normalizedCodes.Add("masters:brand");
        if (hasUnit)
        {
            normalizedCodes.Add("masters:unit");
            normalizedCodes.Add("masters:uom");
        }
        if (hasProduct)
        {
            normalizedCodes.Add("masters:product");
        }

        permissionCodes = normalizedCodes.ToList();

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

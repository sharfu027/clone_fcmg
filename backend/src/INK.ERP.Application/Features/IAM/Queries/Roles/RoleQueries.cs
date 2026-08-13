using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Application.Features.IAM.DTOs;
using INK.ERP.Application.Features.IAM.Filters;
using INK.ERP.Application.Features.IAM.Specifications;

namespace INK.ERP.Application.Features.IAM.Queries.Roles;

// 1. GetRoleByIdQuery
public sealed record GetRoleByIdQuery(Guid RoleId) : IQuery<Result<RoleDto>>;

public sealed class GetRoleByIdQueryHandler : IRequestHandler<GetRoleByIdQuery, Result<RoleDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRoleByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RoleDto>> Handle(GetRoleByIdQuery request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);

        if (role is null || role.IsDeleted)
        {
            return Result.Failure<RoleDto>(IamErrors.Role.NotFound(request.RoleId));
        }

        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var rolePermRepo = _unitOfWork.Repository<RolePermission>();
        var permRepo = _unitOfWork.Repository<Permission>();

        var userRoles = await userRoleRepo.FindAsync(ur => ur.RoleId == role.Id && !ur.IsDeleted, cancellationToken);
        var rolePerms = await rolePermRepo.FindAsync(rp => rp.RoleId == role.Id && !rp.IsDeleted, cancellationToken);
        var permIds = rolePerms.Select(rp => rp.PermissionId).ToList();

        var perms = await permRepo.FindAsync(p => permIds.Contains(p.Id) && !p.IsDeleted && p.IsActive, cancellationToken);
        var permCodes = perms.Select(p => p.Code).ToList();

        var dto = new RoleDto(
            role.Id,
            role.Name ?? role.Code ?? "",
            role.Code ?? "",
            role.Description ?? "",
            role.IsSystem,
            role.Priority,
            role.IsActive,
            userRoles.Count,
            permCodes.Count,
            permCodes,
            role.CreatedAtUtc,
            role.LastModifiedAtUtc,
            role.CreatedBy,
            role.ModifiedBy);

        return Result.Success(dto);
    }
}

// 2. GetRolesQuery (Paged with search, filter, counts)
public sealed record GetRolesQuery(RoleFilter Filter) : IQuery<Result<PagedResult<RoleDto>>>;

public sealed class GetRolesQueryHandler : IRequestHandler<GetRolesQuery, Result<PagedResult<RoleDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRolesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResult<RoleDto>>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var rolePermRepo = _unitOfWork.Repository<RolePermission>();

        var spec = new RoleFilterSpecification(request.Filter);
        var roles = await roleRepo.ListAsync(spec, cancellationToken);
        var totalCount = await roleRepo.CountAsync(spec, cancellationToken);

        var roleIds = roles.Select(r => r.Id).ToList();

        var allUserRoles = await userRoleRepo.FindAsync(ur => roleIds.Contains(ur.RoleId) && !ur.IsDeleted, cancellationToken);
        var allRolePerms = await rolePermRepo.FindAsync(rp => roleIds.Contains(rp.RoleId) && !rp.IsDeleted, cancellationToken);

        var userCounts = allUserRoles.GroupBy(ur => ur.RoleId).ToDictionary(g => g.Key, g => g.Count());
        var permCounts = allRolePerms.GroupBy(rp => rp.RoleId).ToDictionary(g => g.Key, g => g.Count());

        var dtos = roles.Select(r => new RoleDto(
            r.Id,
            r.Name ?? r.Code ?? "",
            r.Code ?? "",
            r.Description ?? "",
            r.IsSystem,
            r.Priority,
            r.IsActive,
            userCounts.GetValueOrDefault(r.Id, 0),
            permCounts.GetValueOrDefault(r.Id, 0),
            null,
            r.CreatedAtUtc,
            r.LastModifiedAtUtc,
            r.CreatedBy,
            r.ModifiedBy
        )).ToList();

        var pagedResult = PagedResult<RoleDto>.Create(dtos, totalCount, request.Filter.PageNumber, request.Filter.PageSize);
        return Result.Success(pagedResult);
    }
}

// 3. GetRoleStatsQuery
public sealed record GetRoleStatsQuery : IQuery<Result<RoleStatsDto>>;

public sealed class GetRoleStatsQueryHandler : IRequestHandler<GetRoleStatsQuery, Result<RoleStatsDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRoleStatsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RoleStatsDto>> Handle(GetRoleStatsQuery request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var permRepo = _unitOfWork.Repository<Permission>();

        var roles = await roleRepo.FindAsync(r => !r.IsDeleted, cancellationToken);
        var totalRoles = roles.Count;
        var activeRoles = roles.Count(r => r.IsActive);
        var inactiveRoles = roles.Count(r => !r.IsActive);
        var systemRoles = roles.Count(r => r.IsSystem);
        var customRoles = roles.Count(r => !r.IsSystem);

        var allUserRoles = await userRoleRepo.FindAsync(ur => !ur.IsDeleted, cancellationToken);
        var totalUsersAssigned = allUserRoles.Select(ur => ur.UserId).Distinct().Count();

        var permissions = await permRepo.FindAsync(p => !p.IsDeleted && p.IsActive, cancellationToken);
        var totalPermissions = permissions.Count;

        return Result.Success(new RoleStatsDto(
            totalRoles,
            activeRoles,
            inactiveRoles,
            systemRoles,
            customRoles,
            totalUsersAssigned,
            totalPermissions));
    }
}

// 4. GetAvailablePermissionsQuery
public sealed record GetAvailablePermissionsQuery : IQuery<Result<List<PermissionCategoryDto>>>;

public sealed class GetAvailablePermissionsQueryHandler : IRequestHandler<GetAvailablePermissionsQuery, Result<List<PermissionCategoryDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAvailablePermissionsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<PermissionCategoryDto>>> Handle(GetAvailablePermissionsQuery request, CancellationToken cancellationToken)
    {
        var groupRepo = _unitOfWork.Repository<PermissionGroup>();
        var permRepo = _unitOfWork.Repository<Permission>();

        var groups = await groupRepo.FindAsync(g => !g.IsDeleted && g.IsActive, cancellationToken);
        var permissions = await permRepo.FindAsync(p => !p.IsDeleted && p.IsActive, cancellationToken);

        var orderedGroups = groups.OrderBy(g => g.DisplayOrder).ToList();
        var result = orderedGroups.Select(g => new PermissionCategoryDto(
            g.Id,
            g.Code,
            g.Name,
            g.Description,
            g.DisplayOrder,
            permissions
                .Where(p => p.PermissionGroupId == g.Id)
                .OrderBy(p => p.DisplayOrder)
                .Select(p => new PermissionItemDto(
                    p.Id,
                    p.Code,
                    p.Name,
                    p.Description,
                    p.Code.Contains(':') ? p.Code.Split(':')[1] : p.Code,
                    p.DisplayOrder))
                .ToList()
        )).ToList();

        return Result.Success(result);
    }
}

// 5. GetRolePermissionsQuery
public sealed record GetRolePermissionsQuery(Guid RoleId) : IQuery<Result<List<Guid>>>;

public sealed class GetRolePermissionsQueryHandler : IRequestHandler<GetRolePermissionsQuery, Result<List<Guid>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRolePermissionsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<Guid>>> Handle(GetRolePermissionsQuery request, CancellationToken cancellationToken)
    {
        var rolePermRepo = _unitOfWork.Repository<RolePermission>();
        var rolePerms = await rolePermRepo.FindAsync(rp => rp.RoleId == request.RoleId && !rp.IsDeleted, cancellationToken);
        var permissionIds = rolePerms.Select(rp => rp.PermissionId).ToList();

        return Result.Success(permissionIds);
    }
}

// 6. GetRoleUsersQuery
public sealed record GetRoleUsersQuery(Guid RoleId) : IQuery<Result<List<RoleUserDto>>>;

public sealed class GetRoleUsersQueryHandler : IRequestHandler<GetRoleUsersQuery, Result<List<RoleUserDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRoleUsersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<RoleUserDto>>> Handle(GetRoleUsersQuery request, CancellationToken cancellationToken)
    {
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        var userRoles = await userRoleRepo.FindAsync(ur => ur.RoleId == request.RoleId && !ur.IsDeleted, cancellationToken);
        var userIds = userRoles.Select(ur => ur.UserId).ToList();

        var users = await userRepo.FindAsync(u => userIds.Contains(u.Id) && !u.IsDeleted, cancellationToken);

        var result = users.Select(u => new RoleUserDto(
            u.Id,
            u.UserName ?? u.Email ?? "Unknown",
            u.DisplayName ?? $"{u.FirstName} {u.LastName}".Trim(),
            u.Email ?? "",
            "Operations",
            "HQ Delhi Central",
            u.IsActive,
            u.LastModifiedAtUtc
        )).ToList();

        return Result.Success(result);
    }
}

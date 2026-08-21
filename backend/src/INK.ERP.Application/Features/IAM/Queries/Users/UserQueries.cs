using Mapster;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Application.Features.IAM.DTOs;
using INK.ERP.Application.Features.IAM.Filters;
using INK.ERP.Application.Features.IAM.Specifications;
using INK.ERP.Application.Features.IAM;

namespace INK.ERP.Application.Features.IAM.Queries.Users;

// 1. GetUserByIdQuery
public sealed record GetUserByIdQuery(Guid UserId) : IQuery<Result<UserDto>>;

public sealed class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, Result<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetUserByIdQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserDto>> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();

        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<UserDto>(IamErrors.User.NotFound(request.UserId));
        }

        var isSuperAdmin = _currentUserService.Roles.Contains("Super Administrator");
        var isSubAdmin = _currentUserService.Roles.Contains("Administrator");
        var currentUserIdGuid = Guid.TryParse(_currentUserService.UserId, out var parsedId) ? parsedId : Guid.Empty;

        var targetUserRoles = await userRoleRepo.FindAsync(ur => ur.UserId == user.Id && !ur.IsDeleted, cancellationToken);
        var targetRoleIds = targetUserRoles.Select(ur => ur.RoleId).ToList();
        var targetRoles = await roleRepo.FindAsync(r => targetRoleIds.Contains(r.Id) && !r.IsDeleted, cancellationToken);
        var targetRoleNames = targetRoles.Select(r => r.Name ?? r.Code).ToList();

        // Server-Side Scope Isolation Check:
        // Sub-Admins CANNOT view Super Admins or OTHER Admins (unless it's their own account)
        if (isSubAdmin && !isSuperAdmin && user.Id != currentUserIdGuid)
        {
            if (targetRoleNames.Contains("Super Administrator") || targetRoleNames.Contains("Administrator"))
            {
                return Result.Failure<UserDto>(IamErrors.User.NotFound(request.UserId));
            }
        }

        var assignmentRepo = _unitOfWork.Repository<AdminCompanyAssignment>();
        var companyRepo = _unitOfWork.Repository<INK.ERP.Domain.Entities.MasterData.Company>();

        var assignmentList = await assignmentRepo.FindAsync(a => a.AdminUserId == user.Id && a.IsActive, cancellationToken);
        var activeAssignment = assignmentList.FirstOrDefault();
        INK.ERP.Domain.Entities.MasterData.Company? company = null;
        if (activeAssignment != null)
        {
            company = await companyRepo.GetByIdAsync(activeAssignment.CompanyId, cancellationToken);
        }

        var dto = new UserDto(
            user.Id,
            user.UserName ?? string.Empty,
            user.Email ?? string.Empty,
            user.PhoneNumber,
            user.FirstName,
            user.LastName,
            user.DisplayName,
            user.EmployeeId,
            user.IsActive,
            user.IsLocked,
            user.IsDeleted,
            user.LastLoginUtc,
            user.TwoFactorEnabled,
            user.EmailConfirmed,
            user.RequirePasswordChange,
            user.PreferredLanguage,
            user.TimeZone,
            user.ProfileImageUrl,
            user.CreatedAtUtc,
            user.LastModifiedAtUtc,
            targetRoleNames,
            company?.Id,
            company?.LegalName,
            company?.Code);

        return Result.Success(dto);
    }
}

// 2. GetUsersQuery (Paged with UserScopeSpecification and Projection)
public sealed record GetUsersQuery(UserFilter Filter) : IQuery<Result<PagedResult<UserDto>>>;

public sealed class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, Result<PagedResult<UserDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetUsersQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PagedResult<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var userRepo = (IUserRepository)_unitOfWork.Repository<ApplicationUser>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();

        var isSuperAdmin = _currentUserService.Roles.Contains("Super Administrator");
        var isSubAdmin = _currentUserService.Roles.Contains("Administrator");
        var currentUserIdGuid = Guid.TryParse(_currentUserService.UserId, out var parsedId) ? parsedId : Guid.Empty;

        var restrictedUserIds = new HashSet<Guid>();

        if (isSubAdmin && !isSuperAdmin)
        {
            var adminRoles = await roleRepo.FindAsync(r => (r.Name == "Super Administrator" || r.Name == "Administrator") && !r.IsDeleted, cancellationToken);
            var adminRoleIds = adminRoles.Select(r => r.Id).ToList();

            var adminUserRoles = await userRoleRepo.FindAsync(ur => adminRoleIds.Contains(ur.RoleId) && !ur.IsDeleted, cancellationToken);
            restrictedUserIds = adminUserRoles
                .Select(ur => ur.UserId)
                .Where(id => id != currentUserIdGuid)
                .ToHashSet();
        }

        var spec = new UserScopeSpecification(request.Filter, isSuperAdmin, restrictedUserIds);
        var users = await userRepo.ListWithDeletedAsync(spec, cancellationToken);
        var totalCount = await userRepo.CountWithDeletedAsync(spec, cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();
        var userRoles = await userRoleRepo.FindAsync(ur => userIds.Contains(ur.UserId) && !ur.IsDeleted, cancellationToken);
        var roles = await roleRepo.GetAllAsync(cancellationToken);

        var roleMap = roles.ToDictionary(r => r.Id, r => r.Name ?? r.Code);
        var userRolesMap = userRoles
            .Where(ur => !ur.IsDeleted)
            .GroupBy(ur => ur.UserId)
            .ToDictionary(g => g.Key, g => g.Select(ur => roleMap.GetValueOrDefault(ur.RoleId, string.Empty)).Where(n => !string.IsNullOrEmpty(n)).ToList());

        var assignmentRepo = _unitOfWork.Repository<AdminCompanyAssignment>();
        var companyRepo = _unitOfWork.Repository<INK.ERP.Domain.Entities.MasterData.Company>();

        var assignments = await assignmentRepo.FindAsync(a => userIds.Contains(a.AdminUserId) && a.IsActive, cancellationToken);
        var companyIds = assignments.Select(a => a.CompanyId).Distinct().ToList();
        var companies = await companyRepo.FindAsync(c => companyIds.Contains(c.Id) && !c.IsDeleted, cancellationToken);
        var companyMap = companies.ToDictionary(c => c.Id, c => c);
        var userAssignmentMap = assignments.ToDictionary(a => a.AdminUserId, a => a);

        var resultDtos = users.Select(user => {
            userAssignmentMap.TryGetValue(user.Id, out var assign);
            INK.ERP.Domain.Entities.MasterData.Company? comp = null;
            if (assign != null && companyMap.TryGetValue(assign.CompanyId, out var c))
            {
                comp = c;
            }

            return new UserDto(
                user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                user.PhoneNumber,
                user.FirstName,
                user.LastName,
                user.DisplayName,
                user.EmployeeId,
                user.IsActive,
                user.IsLocked,
                user.IsDeleted,
                user.LastLoginUtc,
                user.TwoFactorEnabled,
                user.EmailConfirmed,
                user.RequirePasswordChange,
                user.PreferredLanguage,
                user.TimeZone,
                user.ProfileImageUrl,
                user.CreatedAtUtc,
                user.LastModifiedAtUtc,
                userRolesMap.GetValueOrDefault(user.Id, new List<string>()),
                comp?.Id,
                comp?.LegalName,
                comp?.Code
            );
        }).ToList();

        var pagedResult = PagedResult<UserDto>.Create(resultDtos, totalCount, request.Filter.PageNumber, request.Filter.PageSize);
        return Result.Success(pagedResult);
    }
}

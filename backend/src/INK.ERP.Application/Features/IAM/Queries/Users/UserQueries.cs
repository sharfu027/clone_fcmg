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

    public GetUserByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        var userRoles = await userRoleRepo.FindAsync(ur => ur.UserId == user.Id && !ur.IsDeleted, cancellationToken);
        var roleIds = userRoles.Select(ur => ur.RoleId).ToList();

        var roles = await roleRepo.FindAsync(r => roleIds.Contains(r.Id) && !r.IsDeleted, cancellationToken);
        var roleNames = roles.Select(r => r.Name ?? r.Code).ToList();

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
            roleNames);

        return Result.Success(dto);
    }
}

// 2. GetUsersQuery (Paged with Specification and Projection)
public sealed record GetUsersQuery(UserFilter Filter) : IQuery<Result<PagedResult<UserDto>>>;

public sealed class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, Result<PagedResult<UserDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUsersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResult<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var userRepo = (IUserRepository)_unitOfWork.Repository<ApplicationUser>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();

        var spec = new UserFilterSpecification(request.Filter);
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

        var resultDtos = users.Select(user => new UserDto(
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
            userRolesMap.GetValueOrDefault(user.Id, new List<string>())
        )).ToList();

        var pagedResult = PagedResult<UserDto>.Create(resultDtos, totalCount, request.Filter.PageNumber, request.Filter.PageSize);
        return Result.Success(pagedResult);
    }
}

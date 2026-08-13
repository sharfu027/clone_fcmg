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

namespace INK.ERP.Application.Features.IAM.Queries.Permissions;

// 5. GetPermissionByIdQuery
public sealed record GetPermissionByIdQuery(Guid PermissionId) : IQuery<Result<PermissionDto>>;

public sealed class GetPermissionByIdQueryHandler : IRequestHandler<GetPermissionByIdQuery, Result<PermissionDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPermissionByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PermissionDto>> Handle(GetPermissionByIdQuery request, CancellationToken cancellationToken)
    {
        var permRepo = _unitOfWork.Repository<Permission>();
        var groupRepo = _unitOfWork.Repository<PermissionGroup>();

        var permission = await permRepo.GetByIdAsync(request.PermissionId, cancellationToken);
        if (permission is null || permission.IsDeleted)
        {
            return Result.Failure<PermissionDto>(IamErrors.Permission.NotFound(request.PermissionId));
        }

        var groupName = string.Empty;
        if (permission.PermissionGroupId != Guid.Empty)
        {
            var group = await groupRepo.GetByIdAsync(permission.PermissionGroupId, cancellationToken);
            if (group != null)
            {
                groupName = group.Name;
            }
        }

        var dto = new PermissionDto(
            permission.Id,
            permission.Name,
            permission.Code,
            permission.Description,
            permission.PermissionGroupId,
            groupName,
            permission.DisplayOrder,
            permission.IsActive);

        return Result.Success(dto);
    }
}

// 6. GetPermissionsQuery (Paged with Specification)
public sealed record GetPermissionsQuery(PermissionFilter Filter) : IQuery<Result<PagedResult<PermissionDto>>>;

public sealed class GetPermissionsQueryHandler : IRequestHandler<GetPermissionsQuery, Result<PagedResult<PermissionDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPermissionsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResult<PermissionDto>>> Handle(GetPermissionsQuery request, CancellationToken cancellationToken)
    {
        var permRepo = _unitOfWork.Repository<Permission>();
        var groupRepo = _unitOfWork.Repository<PermissionGroup>();

        var spec = new PermissionFilterSpecification(request.Filter);
        var permissions = await permRepo.ListAsync(spec, cancellationToken);
        var totalCount = await permRepo.CountAsync(spec, cancellationToken);

        var groups = await groupRepo.GetAllAsync(cancellationToken);
        var groupMap = groups.ToDictionary(g => g.Id, g => g.Name);

        var dtos = permissions.Select(p => new PermissionDto(
            p.Id,
            p.Name,
            p.Code,
            p.Description,
            p.PermissionGroupId,
            groupMap.GetValueOrDefault(p.PermissionGroupId, string.Empty),
            p.DisplayOrder,
            p.IsActive
        )).ToList();

        var pagedResult = PagedResult<PermissionDto>.Create(dtos, totalCount, request.Filter.PageNumber, request.Filter.PageSize);
        return Result.Success(pagedResult);
    }
}

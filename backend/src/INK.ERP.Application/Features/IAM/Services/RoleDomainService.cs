using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Application.Features.IAM.Services;

public interface IRoleDomainService
{
    Task<Result> CanCreateRoleAsync(string code, CancellationToken cancellationToken = default);
    Task<Result> CanDeleteRoleAsync(Guid roleId, CancellationToken cancellationToken = default);
    Task<Result> CanRemoveRoleFromUserAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default);
}

public class RoleDomainService : IRoleDomainService
{
    private readonly IUnitOfWork _unitOfWork;

    public RoleDomainService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> CanCreateRoleAsync(string code, CancellationToken cancellationToken = default)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var existing = await roleRepo.FindAsync(r => r.Code == code && !r.IsDeleted, cancellationToken);
        if (existing.Any())
        {
            return Result.Failure(IamErrors.Role.CodeAlreadyExists(code));
        }

        return Result.Success();
    }

    public async Task<Result> CanDeleteRoleAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var role = await roleRepo.GetByIdAsync(roleId, cancellationToken);
        if (role is null || role.IsDeleted)
        {
            return Result.Failure(IamErrors.Role.NotFound(roleId));
        }

        if (role.IsSystem)
        {
            return Result.Failure(IamErrors.Role.CannotDeleteSystemRole);
        }

        return Result.Success();
    }

    public async Task<Result> CanRemoveRoleFromUserAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();

        var role = await roleRepo.GetByIdAsync(roleId, cancellationToken);
        if (role != null && (role.Code == "ADMIN" || role.Name == "Administrator"))
        {
            var allAdminUserRoles = await userRoleRepo.FindAsync(ur => ur.RoleId == roleId && !ur.IsDeleted, cancellationToken);
            if (allAdminUserRoles.Count <= 1)
            {
                return Result.Failure(IamErrors.Role.CannotRemoveLastAdminRole);
            }
        }

        return Result.Success();
    }
}

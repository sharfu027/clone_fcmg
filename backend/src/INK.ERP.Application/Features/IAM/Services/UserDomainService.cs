using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Application.Features.IAM.Services;

public interface IUserDomainService
{
    Task<Result> CanCreateUserAsync(string username, string email, CancellationToken cancellationToken = default);
    Task<Result> CanDeactivateUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Result> CanAssignRoleToUserAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default);
}

public class UserDomainService : IUserDomainService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserDomainService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> CanCreateUserAsync(string username, string email, CancellationToken cancellationToken = default)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        var existingUsername = await userRepo.FindAsync(u => u.UserName == username && !u.IsDeleted, cancellationToken);
        if (existingUsername.Any())
        {
            return Result.Failure(IamErrors.User.UsernameAlreadyExists(username));
        }

        var existingEmail = await userRepo.FindAsync(u => u.Email == email && !u.IsDeleted, cancellationToken);
        if (existingEmail.Any())
        {
            return Result.Failure(IamErrors.User.EmailAlreadyExists(email));
        }

        return Result.Success();
    }

    public async Task<Result> CanDeactivateUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();

        var adminRoles = await roleRepo.FindAsync(r => r.Code == "ADMIN" || r.Name == "Administrator", cancellationToken);
        if (adminRoles.Any())
        {
            var adminRoleId = adminRoles.First().Id;
            var userRoles = await userRoleRepo.FindAsync(ur => ur.RoleId == adminRoleId && !ur.IsDeleted, cancellationToken);
            var activeAdminUserIds = userRoles.Select(ur => ur.UserId).Distinct().ToList();

            var activeAdmins = await userRepo.FindAsync(u => activeAdminUserIds.Contains(u.Id) && u.IsActive && !u.IsDeleted, cancellationToken);
            if (activeAdmins.Count == 1 && activeAdmins.First().Id == userId)
            {
                return Result.Failure(IamErrors.User.CannotDeactivateLastAdmin);
            }
        }

        return Result.Success();
    }

    public async Task<Result> CanAssignRoleToUserAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();

        var user = await userRepo.GetByIdAsync(userId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure(IamErrors.User.NotFound(userId));
        }

        if (!user.IsActive)
        {
            return Result.Failure(IamErrors.User.InactiveCannotReceiveRoles);
        }

        var role = await roleRepo.GetByIdAsync(roleId, cancellationToken);
        if (role is null || role.IsDeleted)
        {
            return Result.Failure(IamErrors.Role.NotFound(roleId));
        }

        var existingUserRole = await userRoleRepo.FindAsync(ur => ur.UserId == userId && ur.RoleId == roleId && !ur.IsDeleted, cancellationToken);
        if (existingUserRole.Any())
        {
            return Result.Failure(IamErrors.Role.DuplicateAssignment(role.Name ?? role.Code));
        }

        return Result.Success();
    }
}

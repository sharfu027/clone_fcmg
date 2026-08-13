using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Application.Features.IAM.Services;

public interface IPermissionDomainService
{
    Task<Result> CanCreatePermissionAsync(string code, Guid groupId, CancellationToken cancellationToken = default);
}

public class PermissionDomainService : IPermissionDomainService
{
    private readonly IUnitOfWork _unitOfWork;

    public PermissionDomainService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> CanCreatePermissionAsync(string code, Guid groupId, CancellationToken cancellationToken = default)
    {
        var groupRepo = _unitOfWork.Repository<PermissionGroup>();
        var permRepo = _unitOfWork.Repository<Permission>();

        var existingGroup = await groupRepo.GetByIdAsync(groupId, cancellationToken);
        if (existingGroup is null || existingGroup.IsDeleted)
        {
            return Result.Failure(IamErrors.Permission.GroupNotFound(groupId));
        }

        var existingCode = await permRepo.FindAsync(p => p.Code == code && !p.IsDeleted, cancellationToken);
        if (existingCode.Any())
        {
            return Result.Failure(IamErrors.Permission.CodeAlreadyExists(code));
        }

        return Result.Success();
    }
}

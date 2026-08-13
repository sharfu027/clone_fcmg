using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Events.IAM;
using INK.ERP.Application.Features.IAM.Services;

namespace INK.ERP.Application.Features.IAM.Commands.Permissions;

// ----------------------------------------------------
// 13. CreatePermissionCommand
// ----------------------------------------------------
public sealed record CreatePermissionCommand(
    string Name,
    string Code,
    string Description,
    Guid PermissionGroupId,
    int DisplayOrder) : ICommand<Result<Guid>>;

public sealed class CreatePermissionCommandHandler : IRequestHandler<CreatePermissionCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPermissionDomainService _permissionDomainService;
    private readonly IDateTime _dateTime;
    private readonly ILogger<CreatePermissionCommandHandler> _logger;

    public CreatePermissionCommandHandler(
        IUnitOfWork unitOfWork,
        IPermissionDomainService permissionDomainService,
        IDateTime dateTime,
        ILogger<CreatePermissionCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _permissionDomainService = permissionDomainService;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreatePermissionCommand request, CancellationToken cancellationToken)
    {
        var domainValidation = await _permissionDomainService.CanCreatePermissionAsync(request.Code, request.PermissionGroupId, cancellationToken);
        if (domainValidation.IsFailure)
        {
            return Result.Failure<Guid>(domainValidation.Error);
        }

        var permRepo = _unitOfWork.Repository<Permission>();

        var permission = new Permission
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = request.Code,
            Description = request.Description,
            PermissionGroupId = request.PermissionGroupId,
            DisplayOrder = request.DisplayOrder,
            IsActive = true,
            CreatedAtUtc = _dateTime.UtcNow
        };

        permission.AddDomainEvent(new PermissionCreatedEvent(permission.Id, permission.Code));

        await permRepo.AddAsync(permission, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Permission Created: {PermissionId} ({Code})", permission.Id, permission.Code);
        return Result.Success(permission.Id);
    }
}

public sealed class CreatePermissionCommandValidator : AbstractValidator<CreatePermissionCommand>
{
    public CreatePermissionCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(100).Matches(@"^[a-z0-9_:.-]+$");
        RuleFor(x => x.Description).MaximumLength(250);
        RuleFor(x => x.PermissionGroupId).NotEmpty();
    }
}

// ----------------------------------------------------
// 14. UpdatePermissionCommand
// ----------------------------------------------------
public sealed record UpdatePermissionCommand(
    Guid PermissionId,
    string Name,
    string Description,
    int DisplayOrder,
    bool IsActive) : ICommand<Result<Unit>>;

public sealed class UpdatePermissionCommandHandler : IRequestHandler<UpdatePermissionCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;
    private readonly ILogger<UpdatePermissionCommandHandler> _logger;

    public UpdatePermissionCommandHandler(
        IUnitOfWork unitOfWork,
        IDateTime dateTime,
        ILogger<UpdatePermissionCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(UpdatePermissionCommand request, CancellationToken cancellationToken)
    {
        var permRepo = _unitOfWork.Repository<Permission>();
        var permission = await permRepo.GetByIdAsync(request.PermissionId, cancellationToken);
        if (permission is null || permission.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.Permission.NotFound(request.PermissionId));
        }

        permission.Name = request.Name;
        permission.Description = request.Description;
        permission.DisplayOrder = request.DisplayOrder;
        permission.IsActive = request.IsActive;
        permission.LastModifiedAtUtc = _dateTime.UtcNow;

        permission.AddDomainEvent(new PermissionUpdatedEvent(permission.Id));

        permRepo.Update(permission);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Permission Updated: {PermissionId}", permission.Id);
        return Result.Success(Unit.Value);
    }
}

public sealed class UpdatePermissionCommandValidator : AbstractValidator<UpdatePermissionCommand>
{
    public UpdatePermissionCommandValidator()
    {
        RuleFor(x => x.PermissionId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(250);
    }
}

// ----------------------------------------------------
// 15. DeletePermissionCommand
// ----------------------------------------------------
public sealed record DeletePermissionCommand(Guid PermissionId) : ICommand<Result<Unit>>;

public sealed class DeletePermissionCommandHandler : IRequestHandler<DeletePermissionCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public DeletePermissionCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(DeletePermissionCommand request, CancellationToken cancellationToken)
    {
        var permRepo = _unitOfWork.Repository<Permission>();
        var permission = await permRepo.GetByIdAsync(request.PermissionId, cancellationToken);
        if (permission is null || permission.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.Permission.NotFound(request.PermissionId));
        }

        permission.IsDeleted = true;
        permission.IsActive = false;
        permission.LastModifiedAtUtc = _dateTime.UtcNow;

        permission.AddDomainEvent(new PermissionDeletedEvent(permission.Id, permission.Code));

        permRepo.Update(permission);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

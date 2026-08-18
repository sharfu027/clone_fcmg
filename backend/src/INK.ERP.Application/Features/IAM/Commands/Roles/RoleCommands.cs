using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Events.IAM;
using INK.ERP.Application.Features.IAM.Services;

namespace INK.ERP.Application.Features.IAM.Commands.Roles;

// 1. CreateRoleCommand
public sealed record CreateRoleCommand(
    string Name,
    string Code,
    string Description,
    bool IsSystem,
    int Priority) : ICommand<Result<Guid>>;

public sealed class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRoleDomainService _roleDomainService;
    private readonly IDateTime _dateTime;
    private readonly ILogger<CreateRoleCommandHandler> _logger;

    public CreateRoleCommandHandler(
        IUnitOfWork unitOfWork,
        IRoleDomainService roleDomainService,
        IDateTime dateTime,
        ILogger<CreateRoleCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _roleDomainService = roleDomainService;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        var domainValidation = await _roleDomainService.CanCreateRoleAsync(request.Code, cancellationToken);
        if (domainValidation.IsFailure)
        {
            return Result.Failure<Guid>(domainValidation.Error);
        }

        var roleRepo = _unitOfWork.Repository<ApplicationRole>();

        var role = new ApplicationRole
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            NormalizedName = request.Name.Trim().ToUpperInvariant(),
            Code = request.Code.Trim().ToUpperInvariant(),
            Description = request.Description.Trim(),
            IsSystem = request.IsSystem,
            Priority = request.Priority,
            IsActive = true,
            CreatedAtUtc = _dateTime.UtcNow,
            CreatedBy = "Admin"
        };

        role.AddDomainEvent(new RoleCreatedEvent(role.Id, role.Code));

        await roleRepo.AddAsync(role, cancellationToken);

        // Security Audit Log
        var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
        await auditRepo.AddAsync(new SecurityAuditLog
        {
            Id = Guid.NewGuid(),
            Action = "CreateRole",
            Category = "RoleSecurity",
            EntityName = nameof(ApplicationRole),
            EntityId = role.Id.ToString(),
            PerformedBy = "Admin",
            Timestamp = _dateTime.UtcNow,
            IpAddress = "127.0.0.1",
            NewValues = System.Text.Json.JsonSerializer.Serialize(new { role.Name, role.Code, role.Description, role.IsSystem, role.IsActive })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Role Created: {RoleId} ({Code})", role.Id, role.Code);
        return Result.Success(role.Id);
    }
}

public sealed class CreateRoleCommandValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(100).Matches(@"^[A-Z0-9_]+$");
        RuleFor(x => x.Description).MaximumLength(250);
    }
}

// 2. UpdateRoleCommand
public sealed record UpdateRoleCommand(
    Guid RoleId,
    string Name,
    string Description,
    int Priority,
    bool IsActive) : ICommand<Result<Unit>>;

public sealed class UpdateRoleCommandHandler : IRequestHandler<UpdateRoleCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public UpdateRoleCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);
        if (role is null || role.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.Role.NotFound(request.RoleId));
        }

        var oldValues = System.Text.Json.JsonSerializer.Serialize(new { role.Name, role.Description, role.Priority, role.IsActive });

        role.Name = request.Name.Trim();
        role.NormalizedName = request.Name.Trim().ToUpperInvariant();
        role.Description = request.Description.Trim();
        role.Priority = request.Priority;
        role.IsActive = request.IsActive;
        role.LastModifiedAtUtc = _dateTime.UtcNow;
        role.ModifiedBy = "Admin";

        role.AddDomainEvent(new RoleUpdatedEvent(role.Id));

        roleRepo.Update(role);

        // Security Audit Log
        var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
        await auditRepo.AddAsync(new SecurityAuditLog
        {
            Id = Guid.NewGuid(),
            Action = "UpdateRole",
            Category = "RoleSecurity",
            EntityName = nameof(ApplicationRole),
            EntityId = role.Id.ToString(),
            PerformedBy = "Admin",
            Timestamp = _dateTime.UtcNow,
            IpAddress = "127.0.0.1",
            OldValues = oldValues,
            NewValues = System.Text.Json.JsonSerializer.Serialize(new { role.Name, role.Description, role.Priority, role.IsActive })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed class UpdateRoleCommandValidator : AbstractValidator<UpdateRoleCommand>
{
    public UpdateRoleCommandValidator()
    {
        RuleFor(x => x.RoleId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(250);
    }
}

// 3. DeleteRoleCommand
public sealed record DeleteRoleCommand(Guid RoleId) : ICommand<Result<Unit>>;

public sealed class DeleteRoleCommandHandler : IRequestHandler<DeleteRoleCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRoleDomainService _roleDomainService;
    private readonly IDateTime _dateTime;
    private readonly ILogger<DeleteRoleCommandHandler> _logger;

    public DeleteRoleCommandHandler(
        IUnitOfWork unitOfWork,
        IRoleDomainService roleDomainService,
        IDateTime dateTime,
        ILogger<DeleteRoleCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _roleDomainService = roleDomainService;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        var domainValidation = await _roleDomainService.CanDeleteRoleAsync(request.RoleId, cancellationToken);
        if (domainValidation.IsFailure)
        {
            return Result.Failure<Unit>(domainValidation.Error);
        }

        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);

        if (role!.IsSystem)
        {
            return Result.Failure<Unit>(Error.Validation("Role.SystemProtected", "System roles cannot be deleted."));
        }

        role.IsDeleted = true;
        role.IsActive = false;
        role.LastModifiedAtUtc = _dateTime.UtcNow;

        role.AddDomainEvent(new RoleDeletedEvent(role.Id, role.Code));
        roleRepo.Update(role);

        // Audit Log
        var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
        await auditRepo.AddAsync(new SecurityAuditLog
        {
            Id = Guid.NewGuid(),
            Action = "DeleteRole",
            Category = "RoleSecurity",
            EntityName = nameof(ApplicationRole),
            EntityId = role.Id.ToString(),
            PerformedBy = "Admin",
            Timestamp = _dateTime.UtcNow,
            IpAddress = "127.0.0.1",
            OldValues = System.Text.Json.JsonSerializer.Serialize(new { role.Name, role.Code })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Role Deleted: {RoleId} ({Code})", role.Id, role.Code);
        return Result.Success(Unit.Value);
    }
}

// 4. ActivateRoleCommand & DeactivateRoleCommand
public sealed record ActivateRoleCommand(Guid RoleId) : ICommand<Result<Unit>>;

public sealed class ActivateRoleCommandHandler : IRequestHandler<ActivateRoleCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public ActivateRoleCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(ActivateRoleCommand request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);
        if (role is null || role.IsDeleted) return Result.Failure<Unit>(IamErrors.Role.NotFound(request.RoleId));

        role.IsActive = true;
        role.LastModifiedAtUtc = _dateTime.UtcNow;
        roleRepo.Update(role);

        var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
        await auditRepo.AddAsync(new SecurityAuditLog
        {
            Id = Guid.NewGuid(),
            Action = "ActivateRole",
            Category = "RoleSecurity",
            EntityName = nameof(ApplicationRole),
            EntityId = role.Id.ToString(),
            PerformedBy = "Admin",
            Timestamp = _dateTime.UtcNow,
            IpAddress = "127.0.0.1"
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public sealed record DeactivateRoleCommand(Guid RoleId) : ICommand<Result<Unit>>;

public sealed class DeactivateRoleCommandHandler : IRequestHandler<DeactivateRoleCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public DeactivateRoleCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(DeactivateRoleCommand request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);
        if (role is null || role.IsDeleted) return Result.Failure<Unit>(IamErrors.Role.NotFound(request.RoleId));

        if (role.Code == "ADMIN" || role.Name == "Admin")
        {
            return Result.Failure<Unit>(Error.Validation("Role.AdminProtected", "The primary Admin role cannot be deactivated."));
        }

        role.IsActive = false;
        role.LastModifiedAtUtc = _dateTime.UtcNow;
        roleRepo.Update(role);

        var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
        await auditRepo.AddAsync(new SecurityAuditLog
        {
            Id = Guid.NewGuid(),
            Action = "DeactivateRole",
            Category = "RoleSecurity",
            EntityName = nameof(ApplicationRole),
            EntityId = role.Id.ToString(),
            PerformedBy = "Admin",
            Timestamp = _dateTime.UtcNow,
            IpAddress = "127.0.0.1"
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Unit.Value);
    }
}

// 5. CloneRoleCommand
public sealed record CloneRoleCommand(Guid SourceRoleId, string NewName, string NewCode, string Description) : ICommand<Result<Guid>>;

public sealed class CloneRoleCommandHandler : IRequestHandler<CloneRoleCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRoleDomainService _roleDomainService;
    private readonly IDateTime _dateTime;

    public CloneRoleCommandHandler(IUnitOfWork unitOfWork, IRoleDomainService roleDomainService, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _roleDomainService = roleDomainService;
        _dateTime = dateTime;
    }

    public async Task<Result<Guid>> Handle(CloneRoleCommand request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var sourceRole = await roleRepo.GetByIdAsync(request.SourceRoleId, cancellationToken);
        if (sourceRole is null || sourceRole.IsDeleted)
        {
            return Result.Failure<Guid>(IamErrors.Role.NotFound(request.SourceRoleId));
        }

        var newCode = request.NewCode.Trim().ToUpperInvariant();
        var validation = await _roleDomainService.CanCreateRoleAsync(newCode, cancellationToken);
        if (validation.IsFailure) return Result.Failure<Guid>(validation.Error);

        var clonedRole = new ApplicationRole
        {
            Id = Guid.NewGuid(),
            Name = request.NewName.Trim(),
            NormalizedName = request.NewName.Trim().ToUpperInvariant(),
            Code = newCode,
            Description = request.Description.Trim(),
            IsSystem = false,
            Priority = sourceRole.Priority,
            IsActive = true,
            CreatedAtUtc = _dateTime.UtcNow,
            CreatedBy = "Admin"
        };

        await roleRepo.AddAsync(clonedRole, cancellationToken);

        // Copy permission assignments
        var rolePermRepo = _unitOfWork.Repository<RolePermission>();
        var sourcePerms = await rolePermRepo.FindAsync(rp => rp.RoleId == sourceRole.Id && !rp.IsDeleted, cancellationToken);

        foreach (var p in sourcePerms)
        {
            await rolePermRepo.AddAsync(new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = clonedRole.Id,
                PermissionId = p.PermissionId,
                CreatedAtUtc = _dateTime.UtcNow,
                CreatedBy = "Admin"
            }, cancellationToken);
        }

        var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
        await auditRepo.AddAsync(new SecurityAuditLog
        {
            Id = Guid.NewGuid(),
            Action = "CloneRole",
            Category = "RoleSecurity",
            EntityName = nameof(ApplicationRole),
            EntityId = clonedRole.Id.ToString(),
            PerformedBy = "Admin",
            Timestamp = _dateTime.UtcNow,
            IpAddress = "127.0.0.1",
            NewValues = System.Text.Json.JsonSerializer.Serialize(new { SourceRoleId = sourceRole.Id, ClonedRoleId = clonedRole.Id, clonedRole.Name, clonedRole.Code, PermissionsCopied = sourcePerms.Count })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(clonedRole.Id);
    }
}

// 6. UpdateRolePermissionsCommand
public sealed record UpdateRolePermissionsCommand(Guid RoleId, List<Guid> PermissionIds) : ICommand<Result<Unit>>;

public sealed class UpdateRolePermissionsCommandHandler : IRequestHandler<UpdateRolePermissionsCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public UpdateRolePermissionsCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(UpdateRolePermissionsCommand request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);
        if (role is null || role.IsDeleted) return Result.Failure<Unit>(IamErrors.Role.NotFound(request.RoleId));

        var rolePermRepo = _unitOfWork.Repository<RolePermission>();
        var existingPerms = await rolePermRepo.FindAsync(rp => rp.RoleId == request.RoleId, cancellationToken);

        // Soft delete removed perms
        foreach (var existing in existingPerms)
        {
            if (!request.PermissionIds.Contains(existing.PermissionId))
            {
                existing.IsDeleted = true;
                existing.DeletedAtUtc = _dateTime.UtcNow;
                rolePermRepo.Update(existing);
            }
            else if (existing.IsDeleted)
            {
                existing.IsDeleted = false;
                existing.LastModifiedAtUtc = _dateTime.UtcNow;
                rolePermRepo.Update(existing);
            }
        }

        // Add new perms
        var existingPermIds = existingPerms.Select(p => p.PermissionId).ToHashSet();
        foreach (var pId in request.PermissionIds)
        {
            if (!existingPermIds.Contains(pId))
            {
                await rolePermRepo.AddAsync(new RolePermission
                {
                    Id = Guid.NewGuid(),
                    RoleId = request.RoleId,
                    PermissionId = pId,
                    CreatedAtUtc = _dateTime.UtcNow,
                    CreatedBy = "Admin"
                }, cancellationToken);
            }
        }

        var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
        await auditRepo.AddAsync(new SecurityAuditLog
        {
            Id = Guid.NewGuid(),
            Action = "UpdateRolePermissions",
            Category = "RoleSecurity",
            EntityName = nameof(RolePermission),
            EntityId = request.RoleId.ToString(),
            PerformedBy = "Admin",
            Timestamp = _dateTime.UtcNow,
            IpAddress = "127.0.0.1",
            NewValues = System.Text.Json.JsonSerializer.Serialize(new { RoleId = request.RoleId, PermissionCount = request.PermissionIds.Count })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Unit.Value);
    }
}

// 7. RemoveUserFromRoleCommand
public sealed record RemoveUserFromRoleCommand(Guid RoleId, Guid UserId) : ICommand<Result<Unit>>;

public sealed class RemoveUserFromRoleCommandHandler : IRequestHandler<RemoveUserFromRoleCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public RemoveUserFromRoleCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(RemoveUserFromRoleCommand request, CancellationToken cancellationToken)
    {
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);
        if (role is null || role.IsDeleted) return Result.Failure<Unit>(IamErrors.Role.NotFound(request.RoleId));

        var userRoleRepo = _unitOfWork.Repository<UserRole>();

        // Last Admin Protection Validation
        if (role.Code == "ADMIN" || role.Name == "Admin")
        {
            var adminUserRoles = await userRoleRepo.FindAsync(ur => ur.RoleId == role.Id && !ur.IsDeleted, cancellationToken);
            if (adminUserRoles.Count <= 1)
            {
                return Result.Failure<Unit>(Error.Validation("Role.LastAdminProtection", "Cannot remove the last user assigned to the Admin role."));
            }
        }

        var activeRoles = await userRoleRepo.FindAsync(ur => ur.RoleId == request.RoleId && ur.UserId == request.UserId && !ur.IsDeleted, cancellationToken);
        var userRole = activeRoles.FirstOrDefault();

        if (userRole != null)
        {
            userRole.IsDeleted = true;
            userRole.DeletedAtUtc = _dateTime.UtcNow;
            userRoleRepo.Update(userRole);

            var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
            await auditRepo.AddAsync(new SecurityAuditLog
            {
                Id = Guid.NewGuid(),
                Action = "RemoveUserFromRole",
                Category = "RoleSecurity",
                EntityName = nameof(UserRole),
                EntityId = request.RoleId.ToString(),
                PerformedBy = "Admin",
                Timestamp = _dateTime.UtcNow,
                IpAddress = "127.0.0.1",
                OldValues = System.Text.Json.JsonSerializer.Serialize(new { request.RoleId, request.UserId })
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Result.Success(Unit.Value);
    }
}

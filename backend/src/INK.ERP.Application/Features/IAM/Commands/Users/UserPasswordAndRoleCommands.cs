using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Events.IAM;
using INK.ERP.Application.Features.IAM.Services;

namespace INK.ERP.Application.Features.IAM.Commands.Users;

// ----------------------------------------------------
// 8. ChangePasswordCommand
// ----------------------------------------------------
public sealed record ChangePasswordCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword) : ICommand<Result<Unit>>;

public sealed class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordPolicyService _passwordPolicyService;
    private readonly IDateTime _dateTime;
    private readonly ILogger<ChangePasswordCommandHandler> _logger;

    public ChangePasswordCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordPolicyService passwordPolicyService,
        IDateTime dateTime,
        ILogger<ChangePasswordCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _passwordPolicyService = passwordPolicyService;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var passwordPolicyValidation = _passwordPolicyService.ValidatePassword(request.NewPassword);
        if (passwordPolicyValidation.IsFailure)
        {
            return Result.Failure<Unit>(passwordPolicyValidation.Error);
        }

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        if (user.PasswordHash != "HASHED:" + request.CurrentPassword)
        {
            return Result.Failure<Unit>(IamErrors.User.CurrentPasswordIncorrect);
        }

        user.PasswordHash = "HASHED:" + request.NewPassword;
        user.LastPasswordChangedUtc = _dateTime.UtcNow;
        user.RequirePasswordChange = false;
        user.LastModifiedAtUtc = _dateTime.UtcNow;

        user.AddDomainEvent(new PasswordChangedEvent(user.Id));

        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Password changed for user {UserId}", user.Id);
        return Result.Success(Unit.Value);
    }
}

public sealed class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .Matches(@"[A-Z]")
            .Matches(@"[a-z]")
            .Matches(@"[0-9]");
    }
}

// ----------------------------------------------------
// 9. ForcePasswordResetCommand
// ----------------------------------------------------
public sealed record ForcePasswordResetCommand(Guid UserId) : ICommand<Result<Unit>>;

public sealed class ForcePasswordResetCommandHandler : IRequestHandler<ForcePasswordResetCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public ForcePasswordResetCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(ForcePasswordResetCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        user.RequirePasswordChange = true;
        user.LastModifiedAtUtc = _dateTime.UtcNow;

        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 10. AssignRoleCommand
// ----------------------------------------------------
public sealed record AssignRoleCommand(Guid UserId, Guid RoleId) : ICommand<Result<Unit>>;

public sealed class AssignRoleCommandHandler : IRequestHandler<AssignRoleCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserDomainService _userDomainService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISessionRevocationService _sessionRevocationService;
    private readonly IDateTime _dateTime;
    private readonly ILogger<AssignRoleCommandHandler> _logger;

    public AssignRoleCommandHandler(
        IUnitOfWork unitOfWork,
        IUserDomainService userDomainService,
        ICurrentUserService currentUserService,
        ISessionRevocationService sessionRevocationService,
        IDateTime dateTime,
        ILogger<AssignRoleCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _userDomainService = userDomainService;
        _currentUserService = currentUserService;
        _sessionRevocationService = sessionRevocationService;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(AssignRoleCommand request, CancellationToken cancellationToken)
    {
        var domainValidation = await _userDomainService.CanAssignRoleToUserAsync(request.UserId, request.RoleId, cancellationToken);
        if (domainValidation.IsFailure)
        {
            return Result.Failure<Unit>(domainValidation.Error);
        }

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();

        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);

        // Security Protection: Only Super Administrator can assign Super Administrator or Administrator roles
        var targetRoleName = role?.Name ?? role?.Code ?? string.Empty;
        var isSuperAdmin = _currentUserService.Roles.Contains("Super Administrator");

        if (!isSuperAdmin && (targetRoleName.Equals("Super Administrator", StringComparison.OrdinalIgnoreCase) || targetRoleName.Equals("Administrator", StringComparison.OrdinalIgnoreCase)))
        {
            return Result.Failure<Unit>(Error.Unauthorized("IAM.PrivilegeEscalation", "Only Super Administrators can create or assign administrative roles."));
        }

        var userRole = new UserRole
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            RoleId = request.RoleId,
            CreatedAtUtc = _dateTime.UtcNow
        };

        user!.AddDomainEvent(new RoleAssignedEvent(user.Id, role!.Id, role.Name ?? role.Code));

        await userRoleRepo.AddAsync(userRole, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Active Session Revocation on Role/Permission Mutation
        _sessionRevocationService.RevokeUserSessions(request.UserId, $"Role '{targetRoleName}' assigned by {_currentUserService.Username}");

        _logger.LogInformation("Role {RoleId} assigned to User {UserId} by {Caller}", role.Id, user.Id, _currentUserService.Username);
        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 11. RemoveRoleCommand
// ----------------------------------------------------
public sealed record RemoveRoleCommand(Guid UserId, Guid RoleId) : ICommand<Result<Unit>>;

public sealed class RemoveRoleCommandHandler : IRequestHandler<RemoveRoleCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRoleDomainService _roleDomainService;

    public RemoveRoleCommandHandler(IUnitOfWork unitOfWork, IRoleDomainService roleDomainService)
    {
        _unitOfWork = unitOfWork;
        _roleDomainService = roleDomainService;
    }

    public async Task<Result<Unit>> Handle(RemoveRoleCommand request, CancellationToken cancellationToken)
    {
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        var userRoleList = await userRoleRepo.FindAsync(ur => ur.UserId == request.UserId && ur.RoleId == request.RoleId && !ur.IsDeleted, cancellationToken);
        if (!userRoleList.Any())
        {
            return Result.Success(Unit.Value);
        }

        var domainValidation = await _roleDomainService.CanRemoveRoleFromUserAsync(request.UserId, request.RoleId, cancellationToken);
        if (domainValidation.IsFailure)
        {
            return Result.Failure<Unit>(domainValidation.Error);
        }

        var role = await roleRepo.GetByIdAsync(request.RoleId, cancellationToken);
        var userRole = userRoleList.First();
        userRole.IsDeleted = true;

        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user != null)
        {
            user.AddDomainEvent(new RoleRemovedEvent(user.Id, request.RoleId, role?.Name ?? "Role"));
        }

        userRoleRepo.Update(userRole);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 12. UpdateUserPreferenceCommand
// ----------------------------------------------------
public sealed record UpdateUserPreferenceCommand(
    Guid UserId,
    string Theme,
    string Language,
    string TimeZone,
    string DateFormat,
    string NumberFormat,
    string? NotificationPreferences) : ICommand<Result<Unit>>;

public sealed class UpdateUserPreferenceCommandHandler : IRequestHandler<UpdateUserPreferenceCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public UpdateUserPreferenceCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(UpdateUserPreferenceCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        var prefRepo = _unitOfWork.Repository<UserPreference>();
        var existing = await prefRepo.FindAsync(p => p.UserId == request.UserId && !p.IsDeleted, cancellationToken);

        if (existing.Any())
        {
            var pref = existing.First();
            pref.Theme = request.Theme ?? "light";
            pref.Language = request.Language ?? "en";
            pref.TimeZone = request.TimeZone ?? "UTC";
            pref.DateFormat = request.DateFormat ?? "yyyy-MM-dd";
            pref.NumberFormat = request.NumberFormat ?? "standard";
            pref.NotificationPreferences = request.NotificationPreferences ?? "{}";
            pref.LastModifiedAtUtc = _dateTime.UtcNow;
            prefRepo.Update(pref);
        }
        else
        {
            var pref = new UserPreference
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Theme = request.Theme ?? "light",
                Language = request.Language ?? "en",
                TimeZone = request.TimeZone ?? "UTC",
                DateFormat = request.DateFormat ?? "yyyy-MM-dd",
                NumberFormat = request.NumberFormat ?? "standard",
                NotificationPreferences = request.NotificationPreferences ?? "{}",
                CreatedAtUtc = _dateTime.UtcNow
            };
            await prefRepo.AddAsync(pref, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public sealed class UpdateUserPreferenceCommandValidator : AbstractValidator<UpdateUserPreferenceCommand>
{
    public UpdateUserPreferenceCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Theme).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Language).NotEmpty().MaximumLength(10);
        RuleFor(x => x.TimeZone).NotEmpty().MaximumLength(50);
        RuleFor(x => x.DateFormat).NotEmpty().MaximumLength(20);
        RuleFor(x => x.NumberFormat).NotEmpty().MaximumLength(20);
    }
}

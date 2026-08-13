using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Events.IAM;
using INK.ERP.Application.Features.IAM.Services;

namespace INK.ERP.Application.Features.IAM.Commands.Users;

// ----------------------------------------------------
// 2. UpdateUserCommand
// ----------------------------------------------------
public sealed record UpdateUserCommand(
    Guid UserId,
    string FirstName,
    string LastName,
    string DisplayName,
    string? PhoneNumber,
    string PreferredLanguage,
    string TimeZone,
    string? ProfileImageUrl) : ICommand<Result<Unit>>;

public sealed class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;
    private readonly ILogger<UpdateUserCommandHandler> _logger;

    public UpdateUserCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime, ILogger<UpdateUserCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.DisplayName = request.DisplayName;
        user.PhoneNumber = request.PhoneNumber;
        user.PreferredLanguage = request.PreferredLanguage;
        user.TimeZone = request.TimeZone;
        user.ProfileImageUrl = request.ProfileImageUrl;
        user.LastModifiedAtUtc = _dateTime.UtcNow;

        user.AddDomainEvent(new UserUpdatedEvent(user.Id));

        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User Updated: {UserId}", user.Id);
        return Result.Success(Unit.Value);
    }
}

public sealed class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PreferredLanguage).MaximumLength(10);
        RuleFor(x => x.TimeZone).MaximumLength(50);
    }
}

// ----------------------------------------------------
// 3. DeleteUserCommand (Soft Delete)
// ----------------------------------------------------
public sealed record DeleteUserCommand(Guid UserId) : ICommand<Result<Unit>>;

public sealed class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;
    private readonly ILogger<DeleteUserCommandHandler> _logger;

    public DeleteUserCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime, ILogger<DeleteUserCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        user.IsDeleted = true;
        user.IsActive = false;
        user.LastModifiedAtUtc = _dateTime.UtcNow;

        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User Soft Deleted: {UserId}", user.Id);
        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 4. ActivateUserCommand
// ----------------------------------------------------
public sealed record ActivateUserCommand(Guid UserId) : ICommand<Result<Unit>>;

public sealed class ActivateUserCommandHandler : IRequestHandler<ActivateUserCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTime _dateTime;

    public ActivateUserCommandHandler(IUnitOfWork unitOfWork, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(ActivateUserCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        user.IsActive = true;
        user.LastModifiedAtUtc = _dateTime.UtcNow;
        user.AddDomainEvent(new UserActivatedEvent(user.Id));

        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 5. DeactivateUserCommand
// ----------------------------------------------------
public sealed record DeactivateUserCommand(Guid UserId) : ICommand<Result<Unit>>;

public sealed class DeactivateUserCommandHandler : IRequestHandler<DeactivateUserCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserDomainService _userDomainService;
    private readonly IDateTime _dateTime;

    public DeactivateUserCommandHandler(IUnitOfWork unitOfWork, IUserDomainService userDomainService, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _userDomainService = userDomainService;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(DeactivateUserCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        var domainValidation = await _userDomainService.CanDeactivateUserAsync(request.UserId, cancellationToken);
        if (domainValidation.IsFailure)
        {
            return Result.Failure<Unit>(domainValidation.Error);
        }

        user.IsActive = false;
        user.LastModifiedAtUtc = _dateTime.UtcNow;
        user.AddDomainEvent(new UserDeactivatedEvent(user.Id));

        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 6. LockUserCommand
// ----------------------------------------------------
public sealed record LockUserCommand(Guid UserId, DateTime? LockoutEndUtc) : ICommand<Result<Unit>>;

public sealed class LockUserCommandHandler : IRequestHandler<LockUserCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTime _dateTime;

    public LockUserCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(LockUserCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == request.UserId.ToString())
        {
            return Result.Failure<Unit>(IamErrors.User.CannotLockSelf);
        }

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        user.IsLocked = true;
        user.LockoutEnd = request.LockoutEndUtc.HasValue ? new DateTimeOffset(request.LockoutEndUtc.Value) : DateTimeOffset.MaxValue;
        user.LastModifiedAtUtc = _dateTime.UtcNow;

        user.AddDomainEvent(new UserLockedEvent(user.Id, _currentUserService.Username ?? "System"));

        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 7. UnlockUserCommand
// ----------------------------------------------------
public sealed record UnlockUserCommand(Guid UserId) : ICommand<Result<Unit>>;

public sealed class UnlockUserCommandHandler : IRequestHandler<UnlockUserCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTime _dateTime;

    public UnlockUserCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IDateTime dateTime)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _dateTime = dateTime;
    }

    public async Task<Result<Unit>> Handle(UnlockUserCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<Unit>(IamErrors.User.NotFound(request.UserId));
        }

        user.IsLocked = false;
        user.LockoutEnd = null;
        user.AccessFailedCount = 0;
        user.LastModifiedAtUtc = _dateTime.UtcNow;

        user.AddDomainEvent(new UserUnlockedEvent(user.Id, _currentUserService.Username ?? "System"));

        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

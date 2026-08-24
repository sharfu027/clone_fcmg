using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.IAM.Commands.Admins;

// 1. CreateAdminWithCompanyCommand
public sealed record CreateAdminWithCompanyCommand(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    string Password,
    Guid? CompanyId,
    bool IsActive = true) : ICommand<Result<Guid>>;

public sealed class CreateAdminWithCompanyCommandHandler : IRequestHandler<CreateAdminWithCompanyCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTime _dateTime;
    private readonly ILogger<CreateAdminWithCompanyCommandHandler> _logger;

    public CreateAdminWithCompanyCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IDateTime dateTime,
        ILogger<CreateAdminWithCompanyCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateAdminWithCompanyCommand request, CancellationToken cancellationToken)
    {
        // Enforce Super Administrator privilege
        if (!_currentUserService.Roles.Contains("Super Administrator"))
        {
            return Result.Failure<Guid>(Error.Unauthorized("IAM.SuperAdminOnly", "Only the Super Administrator can create Administrator accounts with company assignments."));
        }

        var companyRepo = _unitOfWork.Repository<Company>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var assignmentRepo = _unitOfWork.Repository<AdminCompanyAssignment>();

        // Validate CompanyId is required and exists
        if (!request.CompanyId.HasValue || request.CompanyId.Value == Guid.Empty)
        {
            return Result.Failure<Guid>(Error.Validation("Company.Required", "Please select an Assigned Company."));
        }

        var company = await companyRepo.GetByIdAsync(request.CompanyId.Value, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result.Failure<Guid>(Error.NotFound("Company.NotFound", "The selected company does not exist or is inactive."));
        }

        var normalizedUser = request.Username.ToUpperInvariant();
        var normalizedEmail = request.Email.ToUpperInvariant();

        var existingUsers = await userRepo.FindAsync(u => (u.NormalizedUserName == normalizedUser || u.NormalizedEmail == normalizedEmail) && !u.IsDeleted, cancellationToken);
        if (existingUsers.Any())
        {
            return Result.Failure<Guid>(Error.Conflict("IAM.UserExists", "A user with the specified username or email already exists."));
        }

        var roles = await roleRepo.FindAsync(r => (r.Name == "Administrator" || r.NormalizedName == "ADMINISTRATOR") && !r.IsDeleted, cancellationToken);
        var adminRole = roles.FirstOrDefault();
        if (adminRole == null)
        {
            return Result.Failure<Guid>(Error.NotFound("IAM.RoleNotFound", "The Administrator role is not initialized in the database."));
        }

        var superAdminId = Guid.TryParse(_currentUserService.UserId, out var parsedSuperId) ? parsedSuperId : (Guid?)null;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var newUser = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = request.Username,
                NormalizedUserName = normalizedUser,
                Email = request.Email,
                NormalizedEmail = normalizedEmail,
                FirstName = request.FirstName,
                LastName = request.LastName,
                DisplayName = $"{request.FirstName} {request.LastName}".Trim(),
                IsActive = request.IsActive,
                IsLocked = false,
                EmailConfirmed = true,
                PasswordHash = "HASHED:" + request.Password,
                CreatedAtUtc = _dateTime.UtcNow,
                CreatedBy = _currentUserService.Username ?? "Super Admin"
            };

            await userRepo.AddAsync(newUser, cancellationToken);

            var userRole = new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = newUser.Id,
                RoleId = adminRole.Id,
                CreatedAtUtc = _dateTime.UtcNow
            };
            await userRoleRepo.AddAsync(userRole, cancellationToken);

            var assignment = new AdminCompanyAssignment
            {
                Id = Guid.NewGuid(),
                AdminUserId = newUser.Id,
                CompanyId = request.CompanyId.Value,
                IsActive = true,
                AssignedAtUtc = _dateTime.UtcNow,
                AssignedByUserId = superAdminId,
                CreatedAtUtc = _dateTime.UtcNow
            };
            await assignmentRepo.AddAsync(assignment, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            _logger.LogInformation("Admin {AdminUsername} created with company {CompanyId} by Super Admin {SuperAdmin}", newUser.UserName, request.CompanyId, _currentUserService.Username);
            return Result.Success(newUser.Id);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            _logger.LogError(ex, "Failed to create Admin user with company assignment.");
            return Result.Failure<Guid>(Error.Failure("IAM.AdminCreationError", "An unexpected error occurred while creating the Administrator."));
        }
    }
}

public sealed class CreateAdminWithCompanyCommandValidator : AbstractValidator<CreateAdminWithCompanyCommand>
{
    public CreateAdminWithCompanyCommandValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Please select an Assigned Company.")
            .Must(id => id.HasValue && id.Value != Guid.Empty).WithMessage("Please select an Assigned Company.");
    }
}

// 2. AssignCompanyToAdminCommand
public sealed record AssignCompanyToAdminCommand(Guid AdminUserId, Guid CompanyId) : ICommand<Result<Unit>>;

public sealed class AssignCompanyToAdminCommandHandler : IRequestHandler<AssignCompanyToAdminCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTime _dateTime;
    private readonly ILogger<AssignCompanyToAdminCommandHandler> _logger;

    public AssignCompanyToAdminCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IDateTime dateTime,
        ILogger<AssignCompanyToAdminCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(AssignCompanyToAdminCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.Roles.Contains("Super Administrator"))
        {
            return Result.Failure<Unit>(Error.Unauthorized("IAM.SuperAdminOnly", "Only the Super Administrator can assign or reassign companies to Administrators."));
        }

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var companyRepo = _unitOfWork.Repository<Company>();
        var assignmentRepo = _unitOfWork.Repository<AdminCompanyAssignment>();

        var adminUser = await userRepo.GetByIdAsync(request.AdminUserId, cancellationToken);
        if (adminUser == null || adminUser.IsDeleted)
        {
            return Result.Failure<Unit>(Error.NotFound("IAM.UserNotFound", "The specified user account was not found."));
        }

        var company = await companyRepo.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result.Failure<Unit>(Error.NotFound("Company.NotFound", "The target company does not exist or is inactive."));
        }

        var superAdminId = Guid.TryParse(_currentUserService.UserId, out var parsedSuperId) ? parsedSuperId : (Guid?)null;

        var activeAssignments = await assignmentRepo.FindAsync(a => a.AdminUserId == request.AdminUserId && a.IsActive, cancellationToken);

        foreach (var existing in activeAssignments)
        {
            existing.IsActive = false;
            existing.RevokedAtUtc = _dateTime.UtcNow;
            existing.RevokedByUserId = superAdminId;
            existing.LastModifiedAtUtc = _dateTime.UtcNow;
            await assignmentRepo.UpdateAsync(existing, cancellationToken);
        }

        var newAssignment = new AdminCompanyAssignment
        {
            Id = Guid.NewGuid(),
            AdminUserId = request.AdminUserId,
            CompanyId = request.CompanyId,
            IsActive = true,
            AssignedAtUtc = _dateTime.UtcNow,
            AssignedByUserId = superAdminId,
            CreatedAtUtc = _dateTime.UtcNow
        };
        await assignmentRepo.AddAsync(newAssignment, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Super Admin {SuperAdmin} assigned Admin {AdminId} to Company {CompanyId}", _currentUserService.Username, request.AdminUserId, request.CompanyId);
        return Result.Success(Unit.Value);
    }
}

// 3. RevokeAdminCompanyAssignmentCommand
public sealed record RevokeAdminCompanyAssignmentCommand(Guid AdminUserId) : ICommand<Result<Unit>>;

public sealed class RevokeAdminCompanyAssignmentCommandHandler : IRequestHandler<RevokeAdminCompanyAssignmentCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTime _dateTime;
    private readonly ILogger<RevokeAdminCompanyAssignmentCommandHandler> _logger;

    public RevokeAdminCompanyAssignmentCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IDateTime dateTime,
        ILogger<RevokeAdminCompanyAssignmentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(RevokeAdminCompanyAssignmentCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.Roles.Contains("Super Administrator"))
        {
            return Result.Failure<Unit>(Error.Unauthorized("IAM.SuperAdminOnly", "Only the Super Administrator can revoke company assignments."));
        }

        var assignmentRepo = _unitOfWork.Repository<AdminCompanyAssignment>();
        var superAdminId = Guid.TryParse(_currentUserService.UserId, out var parsedSuperId) ? parsedSuperId : (Guid?)null;

        var activeAssignments = await assignmentRepo.FindAsync(a => a.AdminUserId == request.AdminUserId && a.IsActive, cancellationToken);

        if (!activeAssignments.Any())
        {
            return Result.Success(Unit.Value);
        }

        foreach (var existing in activeAssignments)
        {
            existing.IsActive = false;
            existing.RevokedAtUtc = _dateTime.UtcNow;
            existing.RevokedByUserId = superAdminId;
            existing.LastModifiedAtUtc = _dateTime.UtcNow;
            await assignmentRepo.UpdateAsync(existing, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Super Admin {SuperAdmin} revoked company assignment for Admin {AdminId}", _currentUserService.Username, request.AdminUserId);
        return Result.Success(Unit.Value);
    }
}

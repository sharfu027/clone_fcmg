using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.IAM.Services;
using INK.ERP.Application.Features.SalesTeam.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.SFA;

namespace INK.ERP.Application.Features.SalesTeam.Commands;

// 1. CreateSalesRepresentativeCommand
public sealed record CreateSalesRepresentativeCommand(
    Guid? CompanyId,
    string FirstName,
    string LastName,
    string Username,
    string Email,
    string Phone,
    string Password,
    Guid? BranchId,
    bool IsActive = true) : IRequest<Result<SalesRepresentativeDto>>;

public sealed class CreateSalesRepresentativeCommandHandler : IRequestHandler<CreateSalesRepresentativeCommand, Result<SalesRepresentativeDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IPasswordPolicyService _passwordPolicyService;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly ILogger<CreateSalesRepresentativeCommandHandler> _logger;

    public CreateSalesRepresentativeCommandHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        IPasswordPolicyService passwordPolicyService,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        ILogger<CreateSalesRepresentativeCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _passwordPolicyService = passwordPolicyService;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _logger = logger;
    }

    public async Task<Result<SalesRepresentativeDto>> Handle(CreateSalesRepresentativeCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<SalesRepresentativeDto>.Failure(Error.Unauthorized("SalesTeam.NoCompany", "No company assigned to current account."));
        }

        // Server-Side Strict Company Isolation: Company Admin uses their own CompanyId
        var targetCompanyId = authorizedCompanyId ?? request.CompanyId ?? Guid.Empty;
        if (targetCompanyId == Guid.Empty)
        {
            return Result<SalesRepresentativeDto>.Failure(Error.Validation("SalesTeam.EmptyCompany", "Target company is required."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(targetCompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<SalesRepresentativeDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<SalesRepresentativeDto>.Failure(Error.NotFound("SalesTeam.CompanyNotFound", "Company was not found."));
        }

        // Validate Branch if provided
        Branch? branch = null;
        if (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty)
        {
            branch = await _branchRepository.GetByIdAsync(request.BranchId.Value, cancellationToken);
            if (branch == null || branch.CompanyId != targetCompanyId || branch.IsDeleted)
            {
                return Result<SalesRepresentativeDto>.Failure(Error.Validation("SalesTeam.InvalidBranch", "The selected branch does not exist or does not belong to your company."));
            }
        }

        // Validate Password
        var passwordCheck = _passwordPolicyService.ValidatePassword(request.Password);
        if (passwordCheck.IsFailure)
        {
            return Result<SalesRepresentativeDto>.Failure(passwordCheck.Error);
        }

        var normalizedUsername = request.Username.Trim().ToUpperInvariant();
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var departmentRepo = _unitOfWork.Repository<Department>();
        var designationRepo = _unitOfWork.Repository<Designation>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();

        var existingUsersByUsername = await userRepo.FindAsync(u => u.NormalizedUserName == normalizedUsername && !u.IsDeleted, cancellationToken);
        if (existingUsersByUsername.Any())
        {
            return Result<SalesRepresentativeDto>.Failure(Error.Conflict("SalesTeam.DuplicateUsername", $"Username '{request.Username}' is already taken."));
        }

        var existingUsersByEmail = await userRepo.FindAsync(u => u.NormalizedEmail == normalizedEmail && !u.IsDeleted, cancellationToken);
        if (existingUsersByEmail.Any())
        {
            return Result<SalesRepresentativeDto>.Failure(Error.Conflict("SalesTeam.DuplicateEmail", $"Email '{request.Email}' is already registered."));
        }

        // Find or create default Sales Department and Designation
        var existingDepts = await departmentRepo.FindAsync(d => d.CompanyId == targetCompanyId && d.Code == "SALES", cancellationToken);
        var salesDept = existingDepts.FirstOrDefault();
        if (salesDept == null)
        {
            salesDept = new Department
            {
                Id = Guid.NewGuid(),
                CompanyId = targetCompanyId,
                Code = "SALES",
                Name = "Sales & Distribution",
                IsActive = true
            };
            await departmentRepo.AddAsync(salesDept, cancellationToken);
        }

        var existingDesignations = await designationRepo.FindAsync(d => d.CompanyId == targetCompanyId && d.Code == "SALES_REP", cancellationToken);
        var salesDesignation = existingDesignations.FirstOrDefault();
        if (salesDesignation == null)
        {
            salesDesignation = new Designation
            {
                Id = Guid.NewGuid(),
                CompanyId = targetCompanyId,
                Code = "SALES_REP",
                Title = "Sales Representative",
                IsActive = true
            };
            await designationRepo.AddAsync(salesDesignation, cancellationToken);
        }

        var companyEmployees = await employeeRepo.FindAsync(e => e.CompanyId == targetCompanyId, cancellationToken);
        var employeeCode = $"REP-{company.Code}-{(companyEmployees.Count + 1):D4}";

        // 1. Create Employee Record
        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = targetCompanyId,
            BranchId = branch?.Id,
            DepartmentId = salesDept.Id,
            DesignationId = salesDesignation.Id,
            EmployeeCode = employeeCode,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            JoiningDate = DateTime.UtcNow.Date,
            IsActive = request.IsActive
        };
        await employeeRepo.AddAsync(employee, cancellationToken);

        // 2. Create ApplicationUser Record
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Username.Trim(),
            NormalizedUserName = normalizedUsername,
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            PhoneNumber = request.Phone.Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            DisplayName = $"{request.FirstName.Trim()} {request.LastName.Trim()}".Trim(),
            EmployeeId = employee.Id,
            IsActive = request.IsActive,
            EmailConfirmed = true,
            PasswordHash = "HASHED:" + request.Password,
            CreatedAtUtc = DateTime.UtcNow
        };
        await userRepo.AddAsync(user, cancellationToken);

        // 3. Assign "Sales Representative" (SALES_REP) Role
        var roles = await roleRepo.FindAsync(r => r.Code == "SALES_REP" || r.NormalizedName == "SALES REPRESENTATIVE", cancellationToken);
        var salesRepRole = roles.FirstOrDefault();
        if (salesRepRole != null)
        {
            var userRole = new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                RoleId = salesRepRole.Id
            };
            await userRoleRepo.AddAsync(userRole, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Sales Representative created: {EmployeeCode} ({Username}) for Company {CompanyId}", employeeCode, user.UserName, targetCompanyId);

        var dto = new SalesRepresentativeDto(
            employee.Id,
            user.Id,
            targetCompanyId,
            company.LegalName,
            branch?.Id,
            branch?.Name,
            employee.EmployeeCode,
            employee.FirstName,
            employee.LastName,
            user.DisplayName,
            user.UserName ?? string.Empty,
            user.Email ?? string.Empty,
            employee.Phone,
            employee.IsActive,
            0,
            user.CreatedAtUtc,
            null);

        return Result<SalesRepresentativeDto>.Success(dto);
    }
}

// 2. UpdateSalesRepresentativeCommand
public sealed record UpdateSalesRepresentativeCommand(
    Guid Id, // Employee Id
    string FirstName,
    string LastName,
    string Phone,
    string Email,
    Guid? BranchId,
    bool IsActive = true) : IRequest<Result<SalesRepresentativeDto>>;

public sealed class UpdateSalesRepresentativeCommandHandler : IRequestHandler<UpdateSalesRepresentativeCommand, Result<SalesRepresentativeDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly ISfaRepository _sfaRepository;
    private readonly ILogger<UpdateSalesRepresentativeCommandHandler> _logger;

    public UpdateSalesRepresentativeCommandHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        ISfaRepository sfaRepository,
        ILogger<UpdateSalesRepresentativeCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _sfaRepository = sfaRepository;
        _logger = logger;
    }

    public async Task<Result<SalesRepresentativeDto>> Handle(UpdateSalesRepresentativeCommand request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        var employee = await employeeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result<SalesRepresentativeDto>.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative was not found."));
        }

        // Validate Company Access
        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(employee.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<SalesRepresentativeDto>.Failure(accessResult.Error);
        }

        Branch? branch = null;
        if (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty && request.BranchId != employee.BranchId)
        {
            branch = await _branchRepository.GetByIdAsync(request.BranchId.Value, cancellationToken);
            if (branch == null || branch.CompanyId != employee.CompanyId || branch.IsDeleted)
            {
                return Result<SalesRepresentativeDto>.Failure(Error.Validation("SalesTeam.InvalidBranch", "Branch does not belong to this company."));
            }
            employee.BranchId = branch.Id;
        }
        else if (!request.BranchId.HasValue)
        {
            employee.BranchId = null;
        }
        else if (employee.BranchId.HasValue)
        {
            branch = await _branchRepository.GetByIdAsync(employee.BranchId.Value, cancellationToken);
        }

        var matchedUsers = await userRepo.FindAsync(u => u.EmployeeId == employee.Id && !u.IsDeleted, cancellationToken);
        var user = matchedUsers.FirstOrDefault();

        // Update Employee details
        employee.FirstName = request.FirstName.Trim();
        employee.LastName = request.LastName.Trim();
        employee.Phone = request.Phone.Trim();
        employee.Email = request.Email.Trim();
        employee.IsActive = request.IsActive;

        if (user != null)
        {
            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            user.DisplayName = $"{request.FirstName.Trim()} {request.LastName.Trim()}".Trim();
            user.PhoneNumber = request.Phone.Trim();
            user.Email = request.Email.Trim();
            user.NormalizedEmail = request.Email.Trim().ToUpperInvariant();
            user.IsActive = request.IsActive;
            user.LastModifiedAtUtc = DateTime.UtcNow;
            await userRepo.UpdateAsync(user, cancellationToken);
        }

        await employeeRepo.UpdateAsync(employee, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var assignments = await _sfaRepository.GetCustomerAssignmentsAsync(
            new List<Guid> { employee.CompanyId },
            employee.Id,
            null,
            cancellationToken);
        var assignedCount = assignments.Count(a => a.IsActive);

        var company = await _companyRepository.GetByIdAsync(employee.CompanyId, cancellationToken);

        var dto = new SalesRepresentativeDto(
            employee.Id,
            user?.Id ?? Guid.Empty,
            employee.CompanyId,
            company?.LegalName,
            employee.BranchId,
            branch?.Name,
            employee.EmployeeCode,
            employee.FirstName,
            employee.LastName,
            user?.DisplayName ?? $"{employee.FirstName} {employee.LastName}",
            user?.UserName ?? string.Empty,
            user?.Email ?? employee.Email,
            employee.Phone,
            employee.IsActive,
            assignedCount,
            user?.CreatedAtUtc ?? DateTime.UtcNow,
            user?.LastLoginUtc);

        return Result<SalesRepresentativeDto>.Success(dto);
    }
}

// 3. ToggleSalesRepresentativeStatusCommand
public sealed record ToggleSalesRepresentativeStatusCommand(Guid Id, bool IsActive) : IRequest<Result>;

public sealed class ToggleSalesRepresentativeStatusCommandHandler : IRequestHandler<ToggleSalesRepresentativeStatusCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public ToggleSalesRepresentativeStatusCommandHandler(IUnitOfWork unitOfWork, ICompanyAccessResolver companyAccessResolver)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result> Handle(ToggleSalesRepresentativeStatusCommand request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        var employee = await employeeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(employee.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return accessResult;
        }

        employee.IsActive = request.IsActive;
        await employeeRepo.UpdateAsync(employee, cancellationToken);

        var users = await userRepo.FindAsync(u => u.EmployeeId == employee.Id && !u.IsDeleted, cancellationToken);
        var user = users.FirstOrDefault();
        if (user != null)
        {
            user.IsActive = request.IsActive;
            user.LastModifiedAtUtc = DateTime.UtcNow;
            await userRepo.UpdateAsync(user, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// 4. ResetSalesRepresentativePasswordCommand
public sealed record ResetSalesRepresentativePasswordCommand(Guid Id, string NewPassword) : IRequest<Result>;

public sealed class ResetSalesRepresentativePasswordCommandHandler : IRequestHandler<ResetSalesRepresentativePasswordCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IPasswordPolicyService _passwordPolicyService;

    public ResetSalesRepresentativePasswordCommandHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        IPasswordPolicyService passwordPolicyService)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _passwordPolicyService = passwordPolicyService;
    }

    public async Task<Result> Handle(ResetSalesRepresentativePasswordCommand request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();

        Employee? employee = await employeeRepo.GetByIdAsync(request.Id, cancellationToken);
        ApplicationUser? user = null;

        if (employee == null)
        {
            user = await userRepo.GetByIdAsync(request.Id, cancellationToken);
            if (user != null && user.EmployeeId.HasValue)
            {
                employee = await employeeRepo.GetByIdAsync(user.EmployeeId.Value, cancellationToken);
            }
        }

        if (employee == null && user == null)
        {
            return Result.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative not found."));
        }

        var targetCompanyId = employee?.CompanyId ?? Guid.Empty;
        if (targetCompanyId == Guid.Empty)
        {
            var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
            targetCompanyId = authorizedCompanyId ?? Guid.Empty;
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(targetCompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return accessResult;
        }

        if (user == null && employee != null)
        {
            var matchedUsers = await userRepo.FindAsync(u => u.EmployeeId == employee.Id && !u.IsDeleted, cancellationToken);
            user = matchedUsers.FirstOrDefault();

            if (user == null && !string.IsNullOrEmpty(employee.Email))
            {
                var normalizedEmail = employee.Email.Trim().ToUpperInvariant();
                var emailUsers = await userRepo.FindAsync(u => (u.NormalizedEmail == normalizedEmail || u.NormalizedUserName == normalizedEmail) && !u.IsDeleted, cancellationToken);
                user = emailUsers.FirstOrDefault();
            }

            if (user == null)
            {
                var directUser = await userRepo.GetByIdAsync(employee.Id, cancellationToken);
                if (directUser != null && !directUser.IsDeleted)
                {
                    user = directUser;
                }
            }
        }

        var passwordCheck = _passwordPolicyService.ValidatePassword(request.NewPassword);
        if (passwordCheck.IsFailure)
        {
            return passwordCheck;
        }

        if (user != null)
        {
            // Security Validation: Ensure target user is indeed a Sales Rep and NOT Super Admin or Company Admin
            var userRoles = await userRoleRepo.FindAsync(ur => ur.UserId == user.Id && !ur.IsDeleted, cancellationToken);
            var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
            var roles = await roleRepo.FindAsync(r => roleIds.Contains(r.Id), cancellationToken);
            var roleNames = roles.Select(r => r.Name ?? r.Code).ToList();

            if (roleNames.Any(r => r.Contains("Super Admin", StringComparison.OrdinalIgnoreCase) || r.Equals("Admin", StringComparison.OrdinalIgnoreCase) || r.Equals("Administrator", StringComparison.OrdinalIgnoreCase)))
            {
                return Result.Failure(Error.Forbidden("SalesTeam.Forbidden", "Cannot reset password for administrative accounts through Sales Team Management."));
            }

            user.PasswordHash = "HASHED:" + request.NewPassword;
            user.LastPasswordChangedUtc = DateTime.UtcNow;
            user.LastModifiedAtUtc = DateTime.UtcNow;
            if (employee != null && user.EmployeeId != employee.Id)
            {
                user.EmployeeId = employee.Id;
            }
            await userRepo.UpdateAsync(user, cancellationToken);
        }
        else if (employee != null)
        {
            // Auto-provision user account for this employee
            var username = !string.IsNullOrEmpty(employee.Email) ? employee.Email.Split('@')[0] : employee.EmployeeCode.ToLower();
            var normalizedUsername = username.ToUpperInvariant();
            var normalizedEmail = (!string.IsNullOrEmpty(employee.Email) ? employee.Email : $"{username}@inkerp.com").ToUpperInvariant();

            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = username,
                NormalizedUserName = normalizedUsername,
                Email = !string.IsNullOrEmpty(employee.Email) ? employee.Email : $"{username}@inkerp.com",
                NormalizedEmail = normalizedEmail,
                PhoneNumber = employee.Phone,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                DisplayName = $"{employee.FirstName} {employee.LastName}".Trim(),
                EmployeeId = employee.Id,
                IsActive = employee.IsActive,
                EmailConfirmed = true,
                PasswordHash = "HASHED:" + request.NewPassword,
                CreatedAtUtc = DateTime.UtcNow
            };
            await userRepo.AddAsync(user, cancellationToken);

            var salesRepRoles = await roleRepo.FindAsync(r => r.Code == "SALES_REP" || r.NormalizedName == "SALES REPRESENTATIVE", cancellationToken);
            var salesRepRole = salesRepRoles.FirstOrDefault();
            if (salesRepRole != null)
            {
                var userRole = new UserRole
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    RoleId = salesRepRole.Id
                };
                await userRoleRepo.AddAsync(userRole, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// 5. AssignCustomersToSalesRepCommand
public sealed record AssignCustomersToSalesRepCommand(Guid SalesRepId, List<Guid> CustomerIds) : IRequest<Result<int>>;

public sealed class AssignCustomersToSalesRepCommandHandler : IRequestHandler<AssignCustomersToSalesRepCommand, Result<int>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICustomerRepository _customerRepository;
    private readonly ISfaRepository _sfaRepository;

    public AssignCustomersToSalesRepCommandHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ICustomerRepository customerRepository,
        ISfaRepository sfaRepository)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _customerRepository = customerRepository;
        _sfaRepository = sfaRepository;
    }

    public async Task<Result<int>> Handle(AssignCustomersToSalesRepCommand request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var employee = await employeeRepo.GetByIdAsync(request.SalesRepId, cancellationToken);
        if (employee == null)
        {
            return Result<int>.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(employee.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<int>.Failure(accessResult.Error);
        }

        var requestedCustomerIds = request.CustomerIds.Distinct().ToList();

        // Validate all requested customers exist and belong to the same company
        if (requestedCustomerIds.Any())
        {
            var companyCustomers = await _customerRepository.FindAsync(c => c.CompanyId == employee.CompanyId, cancellationToken);
            var validIds = companyCustomers.Where(c => c.IsActive).Select(c => c.Id).ToHashSet();

            if (requestedCustomerIds.Any(id => !validIds.Contains(id)))
            {
                return Result<int>.Failure(Error.Validation("SalesTeam.CrossCompanyCustomers", "One or more selected customers do not belong to your company or are inactive."));
            }
        }

        // Fetch existing assignments for this sales rep
        var existingAssignments = await _sfaRepository.GetCustomerAssignmentsAsync(
            new List<Guid> { employee.CompanyId },
            employee.Id,
            null,
            cancellationToken);

        // Deactivate unselected assignments
        foreach (var assignment in existingAssignments)
        {
            if (!requestedCustomerIds.Contains(assignment.CustomerId))
            {
                assignment.IsActive = false;
                assignment.AssignedToUtc = DateTime.UtcNow;
                await _sfaRepository.UpdateCustomerAssignmentAsync(assignment, cancellationToken);
            }
        }

        // Activate or Add selected assignments
        int activeCount = 0;
        foreach (var customerId in requestedCustomerIds)
        {
            var existing = existingAssignments.FirstOrDefault(a => a.CustomerId == customerId);
            if (existing != null)
            {
                existing.IsActive = true;
                existing.AssignedToUtc = null;
                await _sfaRepository.UpdateCustomerAssignmentAsync(existing, cancellationToken);
            }
            else
            {
                var newAssignment = new SalesRepCustomerAssignment
                {
                    Id = Guid.NewGuid(),
                    CompanyId = employee.CompanyId,
                    EmployeeId = employee.Id,
                    CustomerId = customerId,
                    AssignedFromUtc = DateTime.UtcNow,
                    IsActive = true
                };
                await _sfaRepository.AddCustomerAssignmentAsync(newAssignment, cancellationToken);
            }
            activeCount++;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(activeCount);
    }
}

// 6. RegisterSalesRepLocationCommand
public sealed record RegisterSalesRepLocationCommand(
    Guid Id,
    string LocationName,
    double Latitude,
    double Longitude,
    double AllowedRadiusMeters = 50.0) : IRequest<Result<SalesRepLocationEnrollmentDto>>;

public sealed class RegisterSalesRepLocationCommandHandler : IRequestHandler<RegisterSalesRepLocationCommand, Result<SalesRepLocationEnrollmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ISfaRepository _sfaRepository;

    public RegisterSalesRepLocationCommandHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ISfaRepository sfaRepository)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _sfaRepository = sfaRepository;
    }

    public async Task<Result<SalesRepLocationEnrollmentDto>> Handle(RegisterSalesRepLocationCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.LocationName))
            return Result<SalesRepLocationEnrollmentDto>.Failure(Error.Validation("Location.NameRequired", "Location name is required."));

        if (double.IsNaN(request.Latitude) || double.IsNaN(request.Longitude) ||
            request.Latitude < -90.0 || request.Latitude > 90.0 ||
            request.Longitude < -180.0 || request.Longitude > 180.0)
        {
            return Result<SalesRepLocationEnrollmentDto>.Failure(Error.Validation("Location.InvalidCoordinates", "Latitude must be between -90 and 90, and longitude between -180 and 180."));
        }

        if (request.AllowedRadiusMeters < 1.0 || request.AllowedRadiusMeters > 50000.0)
        {
            return Result<SalesRepLocationEnrollmentDto>.Failure(Error.Validation("Location.InvalidRadius", "Allowed radius must be between 1 and 50,000 meters."));
        }

        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        Employee? employee = await employeeRepo.GetByIdAsync(request.Id, cancellationToken);
        ApplicationUser? user = null;

        if (employee == null)
        {
            user = await userRepo.GetByIdAsync(request.Id, cancellationToken);
            if (user != null && user.EmployeeId.HasValue)
            {
                employee = await employeeRepo.GetByIdAsync(user.EmployeeId.Value, cancellationToken);
            }
        }

        if (employee == null && user == null)
        {
            return Result<SalesRepLocationEnrollmentDto>.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative was not found."));
        }

        var targetCompanyId = employee?.CompanyId ?? Guid.Empty;
        if (targetCompanyId == Guid.Empty)
        {
            var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
            targetCompanyId = authorizedCompanyId ?? Guid.Empty;
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(targetCompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<SalesRepLocationEnrollmentDto>.Failure(accessResult.Error);
        }

        var employeeId = employee?.Id ?? request.Id;
        var existing = await _sfaRepository.GetLocationEnrollmentAsync(employeeId, cancellationToken);
        if (existing == null && user != null)
        {
            existing = await _sfaRepository.GetLocationEnrollmentByUserIdAsync(user.Id, cancellationToken);
        }

        if (existing != null)
        {
            existing.LocationName = request.LocationName.Trim();
            existing.Latitude = request.Latitude;
            existing.Longitude = request.Longitude;
            existing.AllowedRadiusMeters = request.AllowedRadiusMeters > 0 ? request.AllowedRadiusMeters : 50.0;
            existing.IsActive = true;
            existing.LastModifiedAtUtc = DateTime.UtcNow;
            if (user != null && !existing.UserId.HasValue)
            {
                existing.UserId = user.Id;
            }

            await _sfaRepository.UpdateLocationEnrollmentAsync(existing, cancellationToken);
            await _sfaRepository.SaveChangesAsync(cancellationToken);

            return Result<SalesRepLocationEnrollmentDto>.Success(new SalesRepLocationEnrollmentDto(
                existing.Id,
                existing.CompanyId,
                existing.EmployeeId,
                existing.UserId,
                existing.LocationName,
                existing.Latitude,
                existing.Longitude,
                existing.AllowedRadiusMeters,
                existing.IsActive,
                existing.EnrolledAtUtc,
                existing.EnrolledByUserId,
                existing.LastModifiedAtUtc
            ));
        }

        var newEnrollment = new SalesRepLocationEnrollment
        {
            Id = Guid.NewGuid(),
            CompanyId = targetCompanyId,
            EmployeeId = employeeId,
            UserId = user?.Id,
            LocationName = request.LocationName.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            AllowedRadiusMeters = request.AllowedRadiusMeters > 0 ? request.AllowedRadiusMeters : 50.0,
            IsActive = true,
            EnrolledAtUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _sfaRepository.AddLocationEnrollmentAsync(newEnrollment, cancellationToken);
        await _sfaRepository.SaveChangesAsync(cancellationToken);

        return Result<SalesRepLocationEnrollmentDto>.Success(new SalesRepLocationEnrollmentDto(
            newEnrollment.Id,
            newEnrollment.CompanyId,
            newEnrollment.EmployeeId,
            newEnrollment.UserId,
            newEnrollment.LocationName,
            newEnrollment.Latitude,
            newEnrollment.Longitude,
            newEnrollment.AllowedRadiusMeters,
            newEnrollment.IsActive,
            newEnrollment.EnrolledAtUtc,
            newEnrollment.EnrolledByUserId,
            null
        ));
    }
}

// 7. DeleteSalesRepLocationCommand
public sealed record DeleteSalesRepLocationCommand(Guid Id) : IRequest<Result>;

public sealed class DeleteSalesRepLocationCommandHandler : IRequestHandler<DeleteSalesRepLocationCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ISfaRepository _sfaRepository;

    public DeleteSalesRepLocationCommandHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ISfaRepository sfaRepository)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _sfaRepository = sfaRepository;
    }

    public async Task<Result> Handle(DeleteSalesRepLocationCommand request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        Employee? employee = await employeeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            var user = await userRepo.GetByIdAsync(request.Id, cancellationToken);
            if (user != null && user.EmployeeId.HasValue)
            {
                employee = await employeeRepo.GetByIdAsync(user.EmployeeId.Value, cancellationToken);
            }
        }

        if (employee == null)
        {
            return Result.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(employee.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return accessResult;
        }

        var enrollment = await _sfaRepository.GetLocationEnrollmentAsync(employee.Id, cancellationToken);
        if (enrollment != null)
        {
            await _sfaRepository.DeleteLocationEnrollmentAsync(enrollment, cancellationToken);
            await _sfaRepository.SaveChangesAsync(cancellationToken);
        }

        return Result.Success();
    }
}

// 8. EnrollSalesRepFaceCommand
public sealed record EnrollSalesRepFaceCommand(
    Guid Id,
    byte[] ImageData,
    string AlgorithmVersion = "v1.0") : IRequest<Result<Guid>>;

public sealed class EnrollSalesRepFaceCommandHandler : IRequestHandler<EnrollSalesRepFaceCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly INK.ERP.Application.Features.Security.Face.Workflows.IFaceEnrollmentWorkflow _faceEnrollmentWorkflow;

    public EnrollSalesRepFaceCommandHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        INK.ERP.Application.Features.Security.Face.Workflows.IFaceEnrollmentWorkflow faceEnrollmentWorkflow)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _faceEnrollmentWorkflow = faceEnrollmentWorkflow;
    }

    public async Task<Result<Guid>> Handle(EnrollSalesRepFaceCommand request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();

        Employee? employee = await employeeRepo.GetByIdAsync(request.Id, cancellationToken);
        ApplicationUser? user = null;

        if (employee == null)
        {
            user = await userRepo.GetByIdAsync(request.Id, cancellationToken);
            if (user != null && user.EmployeeId.HasValue)
            {
                employee = await employeeRepo.GetByIdAsync(user.EmployeeId.Value, cancellationToken);
            }
        }

        if (employee == null && user == null)
        {
            return Result<Guid>.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative was not found."));
        }

        var targetCompanyId = employee?.CompanyId ?? Guid.Empty;
        if (targetCompanyId == Guid.Empty)
        {
            var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
            targetCompanyId = authorizedCompanyId ?? Guid.Empty;
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(targetCompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Guid>.Failure(accessResult.Error);
        }

        if (user == null && employee != null)
        {
            var matchedUsers = await userRepo.FindAsync(u => u.EmployeeId == employee.Id && !u.IsDeleted, cancellationToken);
            user = matchedUsers.FirstOrDefault();

            if (user == null && !string.IsNullOrEmpty(employee.Email))
            {
                var normalizedEmail = employee.Email.Trim().ToUpperInvariant();
                var emailUsers = await userRepo.FindAsync(u => (u.NormalizedEmail == normalizedEmail || u.NormalizedUserName == normalizedEmail) && !u.IsDeleted, cancellationToken);
                user = emailUsers.FirstOrDefault();
            }

            if (user == null)
            {
                var directUser = await userRepo.GetByIdAsync(employee.Id, cancellationToken);
                if (directUser != null && !directUser.IsDeleted)
                {
                    user = directUser;
                }
            }

            if (user == null)
            {
                // Auto-provision user account for this sales rep
                var username = !string.IsNullOrEmpty(employee.Email) ? employee.Email.Split('@')[0] : employee.EmployeeCode.ToLower();
                user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = username,
                    NormalizedUserName = username.ToUpperInvariant(),
                    Email = !string.IsNullOrEmpty(employee.Email) ? employee.Email : $"{username}@inkerp.com",
                    NormalizedEmail = (!string.IsNullOrEmpty(employee.Email) ? employee.Email : $"{username}@inkerp.com").ToUpperInvariant(),
                    PhoneNumber = employee.Phone,
                    FirstName = employee.FirstName,
                    LastName = employee.LastName,
                    DisplayName = $"{employee.FirstName} {employee.LastName}".Trim(),
                    EmployeeId = employee.Id,
                    IsActive = employee.IsActive,
                    EmailConfirmed = true,
                    PasswordHash = "HASHED:TempPassword123!",
                    CreatedAtUtc = DateTime.UtcNow
                };
                await userRepo.AddAsync(user, cancellationToken);

                var salesRepRoles = await roleRepo.FindAsync(r => r.Code == "SALES_REP" || r.NormalizedName == "SALES REPRESENTATIVE", cancellationToken);
                var salesRepRole = salesRepRoles.FirstOrDefault();
                if (salesRepRole != null)
                {
                    await userRoleRepo.AddAsync(new UserRole { Id = Guid.NewGuid(), UserId = user.Id, RoleId = salesRepRole.Id }, cancellationToken);
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        if (user == null)
        {
            return Result<Guid>.Failure(Error.NotFound("SalesTeam.UserNotFound", "Linked user account could not be resolved."));
        }

        // Delegate to existing production biometric enrollment workflow
        var enrollCommand = new INK.ERP.Application.Features.Security.Face.EnrollFaceCommand(
            user.Id,
            request.ImageData,
            request.AlgorithmVersion);

        var enrollResult = await _faceEnrollmentWorkflow.ExecuteAsync(enrollCommand, cancellationToken);
        if (enrollResult.IsFailure)
        {
            return Result<Guid>.Failure(enrollResult.Error);
        }

        return Result<Guid>.Success(enrollResult.Value.Id);
    }
}

// 9. DeleteSalesRepFaceCommand
public sealed record DeleteSalesRepFaceCommand(Guid Id) : IRequest<Result>;

public sealed class DeleteSalesRepFaceCommandHandler : IRequestHandler<DeleteSalesRepFaceCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IFaceProfileRepository _faceProfileRepository;
    private readonly Microsoft.Extensions.Logging.ILogger<DeleteSalesRepFaceCommandHandler> _logger;

    public DeleteSalesRepFaceCommandHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        IFaceProfileRepository faceProfileRepository,
        Microsoft.Extensions.Logging.ILogger<DeleteSalesRepFaceCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _faceProfileRepository = faceProfileRepository;
        _logger = logger;
    }

    public async Task<Result> Handle(DeleteSalesRepFaceCommand request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        Employee? employee = await employeeRepo.GetByIdAsync(request.Id, cancellationToken);
        ApplicationUser? user = null;

        if (employee == null)
        {
            user = await userRepo.GetByIdAsync(request.Id, cancellationToken);
            if (user != null && user.EmployeeId.HasValue)
            {
                employee = await employeeRepo.GetByIdAsync(user.EmployeeId.Value, cancellationToken);
            }
        }

        if (employee == null && user == null)
        {
            return Result.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative was not found."));
        }

        var targetCompanyId = employee?.CompanyId ?? Guid.Empty;
        if (targetCompanyId == Guid.Empty)
        {
            var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
            targetCompanyId = authorizedCompanyId ?? Guid.Empty;
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(targetCompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return accessResult;
        }

        if (user == null && employee != null)
        {
            var matchedUsers = await userRepo.FindAsync(u => (u.EmployeeId == employee.Id || u.Id == employee.Id) && !u.IsDeleted, cancellationToken);
            user = matchedUsers.FirstOrDefault();
        }

        if (user != null)
        {
            var profile = await _faceProfileRepository.GetByUserIdAsync(user.Id, cancellationToken);
            if (profile != null)
            {
                profile.DeactivateProfile();

                _logger.LogInformation(
                    "[BUILD_ID: 2026-09-01-RUNTIME-AUDIT-v1] [PRE-SAVE DEACTIVATE] UserId: {UserId} | FaceProfileId: {FaceProfileId} | ActiveVersion: {Version} | Templates: [{Templates}]",
                    profile.UserId,
                    profile.Id,
                    profile.ActiveTemplateVersion,
                    string.Join(", ", profile.Templates.Select(t => $"Id={t.Id}, V={t.Version}, Active={t.IsActive}")));

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        return Result.Success();
    }
}


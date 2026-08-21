using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.IAM.Queries.Admins;

public sealed record AdminAssignmentDto(
    Guid AdminUserId,
    string Username,
    string Email,
    string DisplayName,
    Guid? CompanyId,
    string? CompanyCode,
    string? CompanyLegalName,
    bool IsActive,
    DateTime? AssignedAtUtc);

public sealed record GetAdminCompanyAssignmentsQuery() : IQuery<Result<IReadOnlyList<AdminAssignmentDto>>>;

public sealed class GetAdminCompanyAssignmentsQueryHandler : IRequestHandler<GetAdminCompanyAssignmentsQuery, Result<IReadOnlyList<AdminAssignmentDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetAdminCompanyAssignmentsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<IReadOnlyList<AdminAssignmentDto>>> Handle(GetAdminCompanyAssignmentsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.Roles.Contains("Super Administrator"))
        {
            return Result.Failure<IReadOnlyList<AdminAssignmentDto>>(Error.Unauthorized("IAM.SuperAdminOnly", "Only Super Administrators can inspect all Admin company assignments."));
        }

        var roleRepo = _unitOfWork.Repository<ApplicationRole>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var assignmentRepo = _unitOfWork.Repository<AdminCompanyAssignment>();
        var companyRepo = _unitOfWork.Repository<Company>();

        var roles = await roleRepo.FindAsync(r => (r.Name == "Administrator" || r.NormalizedName == "ADMINISTRATOR") && !r.IsDeleted, cancellationToken);
        var adminRole = roles.FirstOrDefault();

        if (adminRole == null)
        {
            return Result.Success<IReadOnlyList<AdminAssignmentDto>>(new List<AdminAssignmentDto>());
        }

        var adminUserRoles = await userRoleRepo.FindAsync(ur => ur.RoleId == adminRole.Id && !ur.IsDeleted, cancellationToken);
        var adminUserIds = adminUserRoles.Select(ur => ur.UserId).Distinct().ToList();

        var adminUsers = await userRepo.FindAsync(u => adminUserIds.Contains(u.Id) && !u.IsDeleted, cancellationToken);
        var assignments = await assignmentRepo.FindAsync(a => adminUserIds.Contains(a.AdminUserId) && a.IsActive, cancellationToken);

        var companyIds = assignments.Select(a => a.CompanyId).Distinct().ToList();
        var companies = await companyRepo.FindAsync(c => companyIds.Contains(c.Id) && !c.IsDeleted, cancellationToken);

        var companyMap = companies.ToDictionary(c => c.Id, c => c);
        var assignmentMap = assignments.ToDictionary(a => a.AdminUserId, a => a);

        var dtos = adminUsers
            .OrderBy(u => u.UserName)
            .Select(u =>
            {
                assignmentMap.TryGetValue(u.Id, out var assign);
                Company? company = null;
                if (assign != null && companyMap.TryGetValue(assign.CompanyId, out var comp))
                {
                    company = comp;
                }

                return new AdminAssignmentDto(
                    u.Id,
                    u.UserName ?? string.Empty,
                    u.Email ?? string.Empty,
                    u.DisplayName ?? $"{u.FirstName} {u.LastName}".Trim(),
                    company?.Id,
                    company?.Code,
                    company?.LegalName,
                    u.IsActive,
                    assign?.AssignedAtUtc);
            }).ToList();

        return Result.Success<IReadOnlyList<AdminAssignmentDto>>(dtos);
    }
}

public sealed record AdminSubordinateDto(
    Guid Id,
    string EmployeeCode,
    string Name,
    string Email,
    string? Phone,
    string? RoleOrDesignation,
    string? DepartmentName,
    string? BranchName,
    bool IsActive,
    DateTime? JoiningDate);

public sealed record AdminTeamDetailsDto(
    Guid AdminUserId,
    string AdminName,
    string AdminEmail,
    Guid? CompanyId,
    string? CompanyCode,
    string? CompanyLegalName,
    IReadOnlyList<AdminSubordinateDto> Subordinates);

public sealed record GetAdminSubordinatesQuery(Guid AdminUserId) : IQuery<Result<AdminTeamDetailsDto>>;

public sealed class GetAdminSubordinatesQueryHandler : IRequestHandler<GetAdminSubordinatesQuery, Result<AdminTeamDetailsDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetAdminSubordinatesQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AdminTeamDetailsDto>> Handle(GetAdminSubordinatesQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.Roles.Contains("Super Administrator"))
        {
            return Result.Failure<AdminTeamDetailsDto>(Error.Unauthorized("IAM.SuperAdminOnly", "Only Super Administrators can inspect subordinate users under Admins."));
        }

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var assignmentRepo = _unitOfWork.Repository<AdminCompanyAssignment>();
        var companyRepo = _unitOfWork.Repository<Company>();
        var empRepo = _unitOfWork.Repository<Employee>();
        var branchRepo = _unitOfWork.Repository<Branch>();
        var deptRepo = _unitOfWork.Repository<Department>();
        var desigRepo = _unitOfWork.Repository<Designation>();

        var adminUser = await userRepo.GetByIdAsync(request.AdminUserId, cancellationToken);
        if (adminUser == null || adminUser.IsDeleted)
        {
            return Result.Failure<AdminTeamDetailsDto>(Error.NotFound("IAM.AdminNotFound", $"Administrator with ID '{request.AdminUserId}' was not found."));
        }

        var assignments = await assignmentRepo.FindAsync(a => a.AdminUserId == request.AdminUserId && a.IsActive, cancellationToken);
        var activeAssign = assignments.FirstOrDefault();

        if (activeAssign == null)
        {
            return Result.Success(new AdminTeamDetailsDto(
                adminUser.Id,
                adminUser.DisplayName ?? $"{adminUser.FirstName} {adminUser.LastName}".Trim(),
                adminUser.Email ?? string.Empty,
                null,
                null,
                null,
                new List<AdminSubordinateDto>()));
        }

        var company = await companyRepo.GetByIdAsync(activeAssign.CompanyId, cancellationToken);

        var employees = await empRepo.FindAsync(e => e.CompanyId == activeAssign.CompanyId, cancellationToken);
        var branchIds = employees.Select(e => e.BranchId).Distinct().ToList();
        var deptIds = employees.Select(e => e.DepartmentId).Distinct().ToList();
        var desigIds = employees.Select(e => e.DesignationId).Distinct().ToList();

        var branches = await branchRepo.FindAsync(b => branchIds.Contains(b.Id) && !b.IsDeleted, cancellationToken);
        var depts = await deptRepo.FindAsync(d => deptIds.Contains(d.Id) && d.IsActive, cancellationToken);
        var desigs = await desigRepo.FindAsync(dg => desigIds.Contains(dg.Id) && dg.IsActive, cancellationToken);

        var branchMap = branches.ToDictionary(b => b.Id, b => b.Name);
        var deptMap = depts.ToDictionary(d => d.Id, d => d.Name);
        var desigMap = desigs.ToDictionary(dg => dg.Id, dg => dg.Title);

        var subordinates = employees
            .OrderBy(e => e.EmployeeCode)
            .Select(e =>
            {
                branchMap.TryGetValue(e.BranchId, out var branchName);
                deptMap.TryGetValue(e.DepartmentId, out var deptName);
                desigMap.TryGetValue(e.DesignationId, out var desigTitle);

                return new AdminSubordinateDto(
                    e.Id,
                    e.EmployeeCode,
                    $"{e.FirstName} {e.LastName}".Trim(),
                    e.Email,
                    e.Phone,
                    desigTitle ?? "Operational Staff",
                    deptName ?? "General Operations",
                    branchName ?? "Head Office / Direct",
                    e.IsActive,
                    e.JoiningDate);
            })
            .ToList();

        return Result.Success(new AdminTeamDetailsDto(
            adminUser.Id,
            adminUser.DisplayName ?? $"{adminUser.FirstName} {adminUser.LastName}".Trim(),
            adminUser.Email ?? string.Empty,
            company?.Id,
            company?.Code,
            company?.LegalName,
            subordinates));
    }
}

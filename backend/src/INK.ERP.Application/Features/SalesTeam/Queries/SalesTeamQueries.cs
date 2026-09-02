using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Customers.DTOs;
using INK.ERP.Application.Features.SalesTeam.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Entities.SFA;

namespace INK.ERP.Application.Features.SalesTeam.Queries;

// 1. GetSalesRepresentativesQuery
public sealed record GetSalesRepresentativesQuery(
    Guid? CompanyId = null,
    string? Search = null,
    string? Status = null,
    Guid? BranchId = null) : IRequest<Result<IReadOnlyList<SalesRepresentativeDto>>>;

public sealed class GetSalesRepresentativesQueryHandler : IRequestHandler<GetSalesRepresentativesQuery, Result<IReadOnlyList<SalesRepresentativeDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly ISfaRepository _sfaRepository;
    private readonly IFaceProfileRepository _faceProfileRepository;

    public GetSalesRepresentativesQueryHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        ISfaRepository sfaRepository,
        IFaceProfileRepository faceProfileRepository)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _sfaRepository = sfaRepository;
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<IReadOnlyList<SalesRepresentativeDto>>> Handle(GetSalesRepresentativesQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<SalesRepresentativeDto>>(new List<SalesRepresentativeDto>());
        }

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;

        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        IReadOnlyList<Employee> employees;
        if (effectiveCompanyId.HasValue)
        {
            employees = await employeeRepo.FindAsync(e => e.CompanyId == effectiveCompanyId.Value, cancellationToken);
        }
        else
        {
            employees = await employeeRepo.GetAllAsync(cancellationToken);
        }

        var filteredEmployees = employees.AsQueryable();

        if (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty)
        {
            filteredEmployees = filteredEmployees.Where(e => e.BranchId == request.BranchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            filteredEmployees = filteredEmployees.Where(e => e.IsActive == isActive);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            filteredEmployees = filteredEmployees.Where(e =>
                e.FirstName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                e.LastName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                e.EmployeeCode.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                e.Email.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                e.Phone.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var employeeList = filteredEmployees.ToList();
        var empIds = employeeList.Select(e => e.Id).ToHashSet();

        // Fetch linked Users
        var users = await userRepo.FindAsync(u => !u.IsDeleted, cancellationToken);

        // Fetch companies & branches
        var companyIds = employeeList.Select(e => e.CompanyId).Distinct().ToList();
        var allCompanies = await _companyRepository.GetAllAsync(cancellationToken);
        var companyDict = allCompanies.ToDictionary(c => c.Id, c => c.LegalName);

        var allBranches = await _branchRepository.GetAllAsync(cancellationToken);
        var branchDict = allBranches.ToDictionary(b => b.Id, b => b.Name);

        // Fetch active customer assignments
        var assignments = await _sfaRepository.GetCustomerAssignmentsAsync(
            companyIds,
            null,
            null,
            cancellationToken);

        var assignmentLookup = assignments
            .Where(a => a.IsActive && empIds.Contains(a.EmployeeId))
            .GroupBy(a => a.EmployeeId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.CustomerId).ToList());

        // Fetch location enrollment status
        var locationStatusDict = await _sfaRepository.GetLocationEnrollmentStatusAsync(employeeList.Select(e => e.Id).ToList(), cancellationToken);

        // Fetch face profile registrations for users
        var faceProfiles = await _faceProfileRepository.FindAsync(f => f.IsActive && !f.IsDeleted, cancellationToken);
        var userIdsWithFace = faceProfiles.Select(f => f.UserId).ToHashSet();

        var locationEnrollments = await _unitOfWork.Repository<SalesRepLocationEnrollment>().FindAsync(
            l => empIds.Contains(l.EmployeeId) && l.IsActive && !l.IsDeleted, cancellationToken);
        var locationEnrollmentDict = locationEnrollments.ToDictionary(l => l.EmployeeId);

        var dtos = employeeList.Select(e =>
        {
            var linkedUser = users.FirstOrDefault(u =>
                (u.EmployeeId.HasValue && u.EmployeeId.Value == e.Id) ||
                u.Id == e.Id ||
                (!string.IsNullOrEmpty(u.Email) && !string.IsNullOrEmpty(e.Email) && string.Equals(u.Email, e.Email, StringComparison.OrdinalIgnoreCase)));
            var assignedCustomerIds = assignmentLookup.TryGetValue(e.Id, out var custIds) ? custIds : new List<Guid>();
            var companyName = companyDict.TryGetValue(e.CompanyId, out var cName) ? cName : null;
            var branchName = e.BranchId.HasValue && branchDict.TryGetValue(e.BranchId.Value, out var bName) ? bName : null;

            bool hasLocation = locationStatusDict.TryGetValue(e.Id, out var isLoc) && isLoc;
            bool hasFace = linkedUser != null && userIdsWithFace.Contains(linkedUser.Id);

            locationEnrollmentDict.TryGetValue(e.Id, out var locEnrollment);

            return new SalesRepresentativeDto(
                e.Id,
                linkedUser?.Id ?? Guid.Empty,
                e.CompanyId,
                companyName,
                e.BranchId,
                branchName,
                e.EmployeeCode,
                e.FirstName,
                e.LastName,
                linkedUser?.DisplayName ?? $"{e.FirstName} {e.LastName}",
                linkedUser?.UserName ?? e.Email,
                linkedUser?.Email ?? e.Email,
                e.Phone,
                e.IsActive,
                assignedCustomerIds.Count,
                linkedUser?.CreatedAtUtc ?? DateTime.UtcNow,
                linkedUser?.LastLoginUtc,
                assignedCustomerIds,
                hasLocation,
                hasFace,
                locEnrollment?.LocationName,
                locEnrollment?.AllowedRadiusMeters
            );
        }).ToList();

        return Result.Success<IReadOnlyList<SalesRepresentativeDto>>(dtos);
    }
}

// 2. GetSalesRepresentativeByIdQuery
public sealed record GetSalesRepresentativeByIdQuery(Guid Id) : IRequest<Result<SalesRepresentativeDto>>;

public sealed class GetSalesRepresentativeByIdQueryHandler : IRequestHandler<GetSalesRepresentativeByIdQuery, Result<SalesRepresentativeDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly ISfaRepository _sfaRepository;
    private readonly IFaceProfileRepository _faceProfileRepository;

    public GetSalesRepresentativeByIdQueryHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        ISfaRepository sfaRepository,
        IFaceProfileRepository faceProfileRepository)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _sfaRepository = sfaRepository;
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<SalesRepresentativeDto>> Handle(GetSalesRepresentativeByIdQuery request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        var employee = await employeeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result<SalesRepresentativeDto>.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(employee.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<SalesRepresentativeDto>.Failure(accessResult.Error);
        }

        var users = await userRepo.FindAsync(u => !u.IsDeleted, cancellationToken);
        var linkedUser = users.FirstOrDefault(u =>
            (u.EmployeeId.HasValue && u.EmployeeId.Value == employee.Id) ||
            u.Id == employee.Id ||
            (!string.IsNullOrEmpty(u.Email) && !string.IsNullOrEmpty(employee.Email) && string.Equals(u.Email, employee.Email, StringComparison.OrdinalIgnoreCase)));

        var company = await _companyRepository.GetByIdAsync(employee.CompanyId, cancellationToken);
        Branch? branch = null;
        if (employee.BranchId.HasValue)
        {
            branch = await _branchRepository.GetByIdAsync(employee.BranchId.Value, cancellationToken);
        }

        var assignments = await _sfaRepository.GetCustomerAssignmentsAsync(
            new List<Guid> { employee.CompanyId },
            employee.Id,
            null,
            cancellationToken);

        var assignedCustomerIds = assignments.Where(a => a.IsActive).Select(a => a.CustomerId).ToList();

        var locationEnrollment = await _sfaRepository.GetLocationEnrollmentAsync(employee.Id, cancellationToken);
        FaceProfile? faceProfile = null;
        if (linkedUser != null)
        {
            faceProfile = await _faceProfileRepository.GetByUserIdAsync(linkedUser.Id, cancellationToken);
        }

        var dto = new SalesRepresentativeDto(
            employee.Id,
            linkedUser?.Id ?? Guid.Empty,
            employee.CompanyId,
            company?.LegalName,
            employee.BranchId,
            branch?.Name,
            employee.EmployeeCode,
            employee.FirstName,
            employee.LastName,
            linkedUser?.DisplayName ?? $"{employee.FirstName} {employee.LastName}",
            linkedUser?.UserName ?? employee.Email,
            linkedUser?.Email ?? employee.Email,
            employee.Phone,
            employee.IsActive,
            assignedCustomerIds.Count,
            linkedUser?.CreatedAtUtc ?? DateTime.UtcNow,
            linkedUser?.LastLoginUtc,
            assignedCustomerIds,
            locationEnrollment != null && locationEnrollment.IsActive,
            faceProfile != null && faceProfile.IsActive,
            locationEnrollment?.LocationName,
            locationEnrollment?.AllowedRadiusMeters);

        return Result<SalesRepresentativeDto>.Success(dto);
    }
}

// 3. GetSalesRepAssignedCustomersQuery
public sealed record GetSalesRepAssignedCustomersQuery(Guid SalesRepId) : IRequest<Result<IReadOnlyList<CustomerDto>>>;

public sealed class GetSalesRepAssignedCustomersQueryHandler : IRequestHandler<GetSalesRepAssignedCustomersQuery, Result<IReadOnlyList<CustomerDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICustomerRepository _customerRepository;
    private readonly ISfaRepository _sfaRepository;

    public GetSalesRepAssignedCustomersQueryHandler(
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

    public async Task<Result<IReadOnlyList<CustomerDto>>> Handle(GetSalesRepAssignedCustomersQuery request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var employee = await employeeRepo.GetByIdAsync(request.SalesRepId, cancellationToken);
        if (employee == null)
        {
            return Result<IReadOnlyList<CustomerDto>>.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(employee.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<IReadOnlyList<CustomerDto>>.Failure(accessResult.Error);
        }

        var assignments = await _sfaRepository.GetCustomerAssignmentsAsync(
            new List<Guid> { employee.CompanyId },
            employee.Id,
            null,
            cancellationToken);

        var assignedCustomerIds = assignments.Where(a => a.IsActive).Select(a => a.CustomerId).ToHashSet();

        var companyCustomers = await _customerRepository.FindAsync(c => c.CompanyId == employee.CompanyId, cancellationToken);
        var customers = companyCustomers.Where(c => assignedCustomerIds.Contains(c.Id)).ToList();

        var dtos = customers.Select(customer => new CustomerDto(
            customer.Id,
            customer.CompanyId,
            customer.Company?.LegalName,
            customer.Code,
            customer.LegalName,
            customer.TradeName,
            customer.CustomerType,
            customer.Gstin,
            customer.Pan,
            customer.Email,
            customer.Phone,
            customer.Address.AddressLine1,
            customer.Address.AddressLine2,
            customer.Address.City,
            customer.Address.State,
            customer.Address.PostalCode,
            customer.Address.Country,
            customer.CreditLimit,
            customer.CreditDays,
            customer.RouteId,
            customer.Latitude,
            customer.Longitude,
            customer.IsActive,
            customer.CreatedAtUtc)).ToList();

        return Result.Success<IReadOnlyList<CustomerDto>>(dtos);
    }
}

// 4. GetSalesRepLocationQuery
public sealed record GetSalesRepLocationQuery(Guid SalesRepId) : IRequest<Result<SalesRepLocationEnrollmentDto>>;

public sealed class GetSalesRepLocationQueryHandler : IRequestHandler<GetSalesRepLocationQuery, Result<SalesRepLocationEnrollmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ISfaRepository _sfaRepository;

    public GetSalesRepLocationQueryHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ISfaRepository sfaRepository)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _sfaRepository = sfaRepository;
    }

    public async Task<Result<SalesRepLocationEnrollmentDto>> Handle(GetSalesRepLocationQuery request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        Employee? employee = await employeeRepo.GetByIdAsync(request.SalesRepId, cancellationToken);
        ApplicationUser? user = null;

        if (employee == null)
        {
            user = await userRepo.GetByIdAsync(request.SalesRepId, cancellationToken);
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

        var employeeId = employee?.Id ?? request.SalesRepId;
        var enrollment = await _sfaRepository.GetLocationEnrollmentAsync(employeeId, cancellationToken);
        if (enrollment == null && user != null)
        {
            enrollment = await _sfaRepository.GetLocationEnrollmentByUserIdAsync(user.Id, cancellationToken);
        }

        if (enrollment == null)
        {
            return Result<SalesRepLocationEnrollmentDto>.Failure(Error.NotFound("Location.NotFound", "No location enrollment found for this sales representative."));
        }

        var dto = new SalesRepLocationEnrollmentDto(
            enrollment.Id,
            enrollment.CompanyId,
            enrollment.EmployeeId,
            enrollment.UserId,
            enrollment.LocationName,
            enrollment.Latitude,
            enrollment.Longitude,
            enrollment.AllowedRadiusMeters,
            enrollment.IsActive,
            enrollment.EnrolledAtUtc,
            enrollment.EnrolledByUserId,
            enrollment.LastModifiedAtUtc);

        return Result<SalesRepLocationEnrollmentDto>.Success(dto);
    }
}

// 5. GetSalesRepBiometricStatusQuery
public sealed record GetSalesRepBiometricStatusQuery(Guid SalesRepId) : IRequest<Result<SalesRepBiometricStatusDto>>;

public sealed class GetSalesRepBiometricStatusQueryHandler : IRequestHandler<GetSalesRepBiometricStatusQuery, Result<SalesRepBiometricStatusDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ISfaRepository _sfaRepository;
    private readonly IFaceProfileRepository _faceProfileRepository;

    public GetSalesRepBiometricStatusQueryHandler(
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ISfaRepository sfaRepository,
        IFaceProfileRepository faceProfileRepository)
    {
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _sfaRepository = sfaRepository;
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<SalesRepBiometricStatusDto>> Handle(GetSalesRepBiometricStatusQuery request, CancellationToken cancellationToken)
    {
        var employeeRepo = _unitOfWork.Repository<Employee>();
        var userRepo = _unitOfWork.Repository<ApplicationUser>();

        Employee? employee = await employeeRepo.GetByIdAsync(request.SalesRepId, cancellationToken);
        ApplicationUser? user = null;

        if (employee == null)
        {
            user = await userRepo.GetByIdAsync(request.SalesRepId, cancellationToken);
            if (user != null && user.EmployeeId.HasValue)
            {
                employee = await employeeRepo.GetByIdAsync(user.EmployeeId.Value, cancellationToken);
            }
        }

        if (employee == null && user == null)
        {
            return Result<SalesRepBiometricStatusDto>.Failure(Error.NotFound("SalesTeam.NotFound", "Sales Representative was not found."));
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
            return Result<SalesRepBiometricStatusDto>.Failure(accessResult.Error);
        }

        if (user == null && employee != null)
        {
            var matchedUsers = await userRepo.FindAsync(u => (u.EmployeeId == employee.Id || u.Id == employee.Id) && !u.IsDeleted, cancellationToken);
            user = matchedUsers.FirstOrDefault();
            if (user == null && !string.IsNullOrEmpty(employee.Email))
            {
                var normEmail = employee.Email.Trim().ToUpperInvariant();
                var emailUsers = await userRepo.FindAsync(u => (u.NormalizedEmail == normEmail || u.NormalizedUserName == normEmail) && !u.IsDeleted, cancellationToken);
                user = emailUsers.FirstOrDefault();
            }
        }

        var employeeId = employee?.Id ?? request.SalesRepId;
        var locationEnrollment = await _sfaRepository.GetLocationEnrollmentAsync(employeeId, cancellationToken);
        if (locationEnrollment == null && user != null)
        {
            locationEnrollment = await _sfaRepository.GetLocationEnrollmentByUserIdAsync(user.Id, cancellationToken);
        }

        FaceProfile? faceProfile = null;
        if (user != null)
        {
            faceProfile = await _faceProfileRepository.GetByUserIdAsync(user.Id, cancellationToken);
        }

        var latestTemplate = faceProfile?.Templates.Where(t => t.IsActive && !t.IsDeleted).OrderByDescending(t => t.Version).FirstOrDefault();

        var dto = new SalesRepBiometricStatusDto(
            FaceRegistered: faceProfile != null && faceProfile.IsActive && faceProfile.Status == INK.ERP.Domain.Enums.Security.FaceEnrollmentStatus.Enrolled,
            FaceProfileId: faceProfile?.Id,
            TemplateVersion: latestTemplate?.Version,
            FaceEnrolledAtUtc: faceProfile?.CreatedAtUtc,
            LocationRegistered: locationEnrollment != null && locationEnrollment.IsActive,
            LocationName: locationEnrollment?.LocationName,
            Latitude: locationEnrollment?.Latitude,
            Longitude: locationEnrollment?.Longitude,
            AllowedRadiusMeters: locationEnrollment?.AllowedRadiusMeters,
            LocationEnrolledAtUtc: locationEnrollment?.EnrolledAtUtc);

        return Result<SalesRepBiometricStatusDto>.Success(dto);
    }
}

using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Employees.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Employees.Commands;

public record CreateEmployeeCommand(
    Guid CompanyId,
    Guid BranchId,
    Guid DepartmentId,
    Guid DesignationId,
    string EmployeeCode,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    DateTime JoiningDate,
    decimal? Salary) : IRequest<Result<EmployeeDto>>;

public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, Result<EmployeeDto>>
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IDesignationRepository _designationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateEmployeeCommandHandler(
        IEmployeeRepository employeeRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IDepartmentRepository departmentRepository,
        IDesignationRepository designationRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRepository = employeeRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _departmentRepository = departmentRepository;
        _designationRepository = designationRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<EmployeeDto>> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<EmployeeDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<EmployeeDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        var branch = await _branchRepository.GetByIdAsync(request.BranchId, cancellationToken);
        if (branch == null || branch.IsDeleted || branch.CompanyId != targetCompanyId)
        {
            return Result<EmployeeDto>.Failure(Error.Validation("Employee.InvalidBranch", "The selected branch does not exist or does not belong to the authorized company."));
        }

        var department = await _departmentRepository.GetByIdAsync(request.DepartmentId, cancellationToken);
        if (department == null || !department.IsActive || department.CompanyId != targetCompanyId || (department.BranchId.HasValue && department.BranchId.Value != branch.Id))
        {
            return Result<EmployeeDto>.Failure(Error.Validation("Employee.InvalidDepartment", "The selected department does not exist or does not belong to the authorized company/branch."));
        }

        var designation = await _designationRepository.GetByIdAsync(request.DesignationId, cancellationToken);
        if (designation == null || !designation.IsActive || designation.CompanyId != targetCompanyId)
        {
            return Result<EmployeeDto>.Failure(Error.Validation("Employee.InvalidDesignation", "The selected designation does not exist or does not belong to the authorized company."));
        }

        if (!await _employeeRepository.IsEmployeeCodeUniqueAsync(targetCompanyId, request.EmployeeCode, null, cancellationToken))
        {
            return Result<EmployeeDto>.Failure(Error.Conflict("Employee.DuplicateCode", $"Employee code '{request.EmployeeCode}' already exists under company '{company.LegalName}'."));
        }

        if (!await _employeeRepository.IsEmailUniqueAsync(request.Email, null, cancellationToken))
        {
            return Result<EmployeeDto>.Failure(Error.Conflict("Employee.DuplicateEmail", $"Email '{request.Email}' is already registered with another employee."));
        }

        var employee = new Employee
        {
            CompanyId = targetCompanyId,
            BranchId = request.BranchId,
            DepartmentId = request.DepartmentId,
            DesignationId = request.DesignationId,
            EmployeeCode = request.EmployeeCode.ToUpperInvariant().Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone.Trim(),
            JoiningDate = request.JoiningDate.Kind == DateTimeKind.Utc ? request.JoiningDate : DateTime.SpecifyKind(request.JoiningDate, DateTimeKind.Utc),
            Salary = request.Salary,
            IsActive = true
        };

        await _employeeRepository.AddAsync(employee, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new EmployeeDto(
            employee.Id,
            employee.CompanyId,
            company.LegalName,
            employee.BranchId,
            branch.Name,
            employee.DepartmentId,
            department.Name,
            employee.DesignationId,
            designation.Title,
            employee.EmployeeCode,
            employee.FirstName,
            employee.LastName,
            $"{employee.FirstName} {employee.LastName}",
            employee.Email,
            employee.Phone,
            employee.JoiningDate,
            employee.Salary,
            employee.IsActive,
            employee.CreatedAtUtc);

        return Result<EmployeeDto>.Success(dto);
    }
}

public record UpdateEmployeeCommand(
    Guid Id,
    Guid CompanyId,
    Guid BranchId,
    Guid DepartmentId,
    Guid DesignationId,
    string EmployeeCode,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    DateTime JoiningDate,
    decimal? Salary,
    bool IsActive) : IRequest<Result<EmployeeDto>>;

public class UpdateEmployeeCommandHandler : IRequestHandler<UpdateEmployeeCommand, Result<EmployeeDto>>
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IDesignationRepository _designationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateEmployeeCommandHandler(
        IEmployeeRepository employeeRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IDepartmentRepository departmentRepository,
        IDesignationRepository designationRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRepository = employeeRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _departmentRepository = departmentRepository;
        _designationRepository = designationRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<EmployeeDto>> Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result<EmployeeDto>.Failure(Error.NotFound("Employee.NotFound", $"Employee with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(employee.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<EmployeeDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(employee.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<EmployeeDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{employee.CompanyId}' was not found."));
        }

        var branch = await _branchRepository.GetByIdAsync(request.BranchId, cancellationToken);
        if (branch == null || branch.IsDeleted || branch.CompanyId != employee.CompanyId)
        {
            return Result<EmployeeDto>.Failure(Error.Validation("Employee.InvalidBranch", "The selected branch does not exist or does not belong to the authorized company."));
        }

        var department = await _departmentRepository.GetByIdAsync(request.DepartmentId, cancellationToken);
        if (department == null || !department.IsActive || department.CompanyId != employee.CompanyId || (department.BranchId.HasValue && department.BranchId.Value != branch.Id))
        {
            return Result<EmployeeDto>.Failure(Error.Validation("Employee.InvalidDepartment", "The selected department does not exist or does not belong to the authorized company/branch."));
        }

        var designation = await _designationRepository.GetByIdAsync(request.DesignationId, cancellationToken);
        if (designation == null || !designation.IsActive || designation.CompanyId != employee.CompanyId)
        {
            return Result<EmployeeDto>.Failure(Error.Validation("Employee.InvalidDesignation", "The selected designation does not exist or does not belong to the authorized company."));
        }

        if (!await _employeeRepository.IsEmployeeCodeUniqueAsync(employee.CompanyId, request.EmployeeCode, request.Id, cancellationToken))
        {
            return Result<EmployeeDto>.Failure(Error.Conflict("Employee.DuplicateCode", $"Employee code '{request.EmployeeCode}' already exists under company '{company.LegalName}'."));
        }

        if (!await _employeeRepository.IsEmailUniqueAsync(request.Email, request.Id, cancellationToken))
        {
            return Result<EmployeeDto>.Failure(Error.Conflict("Employee.DuplicateEmail", $"Email '{request.Email}' is already registered with another employee."));
        }

        employee.BranchId = request.BranchId;
        employee.DepartmentId = request.DepartmentId;
        employee.DesignationId = request.DesignationId;
        employee.EmployeeCode = request.EmployeeCode.ToUpperInvariant().Trim();
        employee.FirstName = request.FirstName.Trim();
        employee.LastName = request.LastName.Trim();
        employee.Email = request.Email.Trim().ToLowerInvariant();
        employee.Phone = request.Phone.Trim();
        employee.JoiningDate = request.JoiningDate.Kind == DateTimeKind.Utc ? request.JoiningDate : DateTime.SpecifyKind(request.JoiningDate, DateTimeKind.Utc);
        employee.Salary = request.Salary;
        employee.IsActive = request.IsActive;

        await _employeeRepository.UpdateAsync(employee, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new EmployeeDto(
            employee.Id,
            employee.CompanyId,
            company.LegalName,
            employee.BranchId,
            branch.Name,
            employee.DepartmentId,
            department.Name,
            employee.DesignationId,
            designation.Title,
            employee.EmployeeCode,
            employee.FirstName,
            employee.LastName,
            $"{employee.FirstName} {employee.LastName}",
            employee.Email,
            employee.Phone,
            employee.JoiningDate,
            employee.Salary,
            employee.IsActive,
            employee.CreatedAtUtc);

        return Result<EmployeeDto>.Success(dto);
    }
}

public record DeleteEmployeeCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteEmployeeCommandHandler : IRequestHandler<DeleteEmployeeCommand, Result<Unit>>
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteEmployeeCommandHandler(
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Employee.NotFound", $"Employee with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(employee.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        await _employeeRepository.DeleteAsync(employee, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}

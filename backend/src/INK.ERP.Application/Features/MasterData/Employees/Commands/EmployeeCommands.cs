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

    public CreateEmployeeCommandHandler(
        IEmployeeRepository employeeRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IDepartmentRepository departmentRepository,
        IDesignationRepository designationRepository,
        IUnitOfWork unitOfWork)
    {
        _employeeRepository = employeeRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _departmentRepository = departmentRepository;
        _designationRepository = designationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<EmployeeDto>> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<EmployeeDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _employeeRepository.IsEmployeeCodeUniqueAsync(request.CompanyId, request.EmployeeCode, null, cancellationToken))
        {
            return Result<EmployeeDto>.Failure(Error.Conflict("Employee.DuplicateCode", $"Employee code '{request.EmployeeCode}' already exists under company '{company.LegalName}'."));
        }

        if (!await _employeeRepository.IsEmailUniqueAsync(request.Email, null, cancellationToken))
        {
            return Result<EmployeeDto>.Failure(Error.Conflict("Employee.DuplicateEmail", $"Email '{request.Email}' is already registered to another employee."));
        }

        var branch = await _branchRepository.GetByIdAsync(request.BranchId, cancellationToken);
        var department = await _departmentRepository.GetByIdAsync(request.DepartmentId, cancellationToken);
        var designation = await _designationRepository.GetByIdAsync(request.DesignationId, cancellationToken);

        var employee = new Employee
        {
            CompanyId = request.CompanyId,
            BranchId = request.BranchId,
            DepartmentId = request.DepartmentId,
            DesignationId = request.DesignationId,
            EmployeeCode = request.EmployeeCode.ToUpperInvariant().Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.ToLowerInvariant().Trim(),
            Phone = request.Phone.Trim(),
            JoiningDate = request.JoiningDate.Date,
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
            branch?.Name,
            employee.DepartmentId,
            department?.Name,
            employee.DesignationId,
            designation?.Title,
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

    public UpdateEmployeeCommandHandler(
        IEmployeeRepository employeeRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IDepartmentRepository departmentRepository,
        IDesignationRepository designationRepository,
        IUnitOfWork unitOfWork)
    {
        _employeeRepository = employeeRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _departmentRepository = departmentRepository;
        _designationRepository = designationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<EmployeeDto>> Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result<EmployeeDto>.Failure(Error.NotFound("Employee.NotFound", $"Employee with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<EmployeeDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _employeeRepository.IsEmployeeCodeUniqueAsync(request.CompanyId, request.EmployeeCode, request.Id, cancellationToken))
        {
            return Result<EmployeeDto>.Failure(Error.Conflict("Employee.DuplicateCode", $"Employee code '{request.EmployeeCode}' already exists under company '{company.LegalName}'."));
        }

        if (!await _employeeRepository.IsEmailUniqueAsync(request.Email, request.Id, cancellationToken))
        {
            return Result<EmployeeDto>.Failure(Error.Conflict("Employee.DuplicateEmail", $"Email '{request.Email}' is already registered to another employee."));
        }

        var branch = await _branchRepository.GetByIdAsync(request.BranchId, cancellationToken);
        var department = await _departmentRepository.GetByIdAsync(request.DepartmentId, cancellationToken);
        var designation = await _designationRepository.GetByIdAsync(request.DesignationId, cancellationToken);

        employee.CompanyId = request.CompanyId;
        employee.BranchId = request.BranchId;
        employee.DepartmentId = request.DepartmentId;
        employee.DesignationId = request.DesignationId;
        employee.EmployeeCode = request.EmployeeCode.ToUpperInvariant().Trim();
        employee.FirstName = request.FirstName.Trim();
        employee.LastName = request.LastName.Trim();
        employee.Email = request.Email.ToLowerInvariant().Trim();
        employee.Phone = request.Phone.Trim();
        employee.JoiningDate = request.JoiningDate.Date;
        employee.Salary = request.Salary;
        employee.IsActive = request.IsActive;

        await _employeeRepository.UpdateAsync(employee, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new EmployeeDto(
            employee.Id,
            employee.CompanyId,
            company.LegalName,
            employee.BranchId,
            branch?.Name,
            employee.DepartmentId,
            department?.Name,
            employee.DesignationId,
            designation?.Title,
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

    public DeleteEmployeeCommandHandler(IEmployeeRepository employeeRepository, IUnitOfWork unitOfWork)
    {
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Employee.NotFound", $"Employee with ID '{request.Id}' was not found."));
        }

        await _employeeRepository.DeleteAsync(employee, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}

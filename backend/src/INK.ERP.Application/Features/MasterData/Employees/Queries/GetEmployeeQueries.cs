using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Employees.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Employees.Queries;

public record GetEmployeeByIdQuery(Guid Id) : IRequest<Result<EmployeeDto>>;

public class GetEmployeeByIdQueryHandler : IRequestHandler<GetEmployeeByIdQuery, Result<EmployeeDto>>
{
    private readonly IEmployeeRepository _employeeRepository;

    public GetEmployeeByIdQueryHandler(IEmployeeRepository employeeRepository)
    {
        _employeeRepository = employeeRepository;
    }

    public async Task<Result<EmployeeDto>> Handle(GetEmployeeByIdQuery request, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result<EmployeeDto>.Failure(Error.NotFound("Employee.NotFound", $"Employee with ID '{request.Id}' was not found."));
        }

        var dto = new EmployeeDto(
            employee.Id,
            employee.CompanyId,
            employee.Company?.LegalName,
            employee.BranchId,
            employee.Branch?.Name,
            employee.DepartmentId,
            employee.Department?.Name,
            employee.DesignationId,
            employee.Designation?.Title,
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

public record GetEmployeesPagedQuery(
    Guid? CompanyId = null,
    Guid? BranchId = null,
    Guid? DepartmentId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<EmployeeDto>>>;

public class GetEmployeesPagedQueryHandler : IRequestHandler<GetEmployeesPagedQuery, Result<IReadOnlyList<EmployeeDto>>>
{
    private readonly IEmployeeRepository _employeeRepository;

    public GetEmployeesPagedQueryHandler(IEmployeeRepository employeeRepository)
    {
        _employeeRepository = employeeRepository;
    }

    public async Task<Result<IReadOnlyList<EmployeeDto>>> Handle(GetEmployeesPagedQuery request, CancellationToken cancellationToken)
    {
        var employees = await _employeeRepository.GetAllAsync(cancellationToken);
        var query = employees.AsQueryable();

        if (request.CompanyId.HasValue)
        {
            query = query.Where(e => e.CompanyId == request.CompanyId.Value);
        }

        if (request.BranchId.HasValue)
        {
            query = query.Where(e => e.BranchId == request.BranchId.Value);
        }

        if (request.DepartmentId.HasValue)
        {
            query = query.Where(e => e.DepartmentId == request.DepartmentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(e => e.EmployeeCode.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     e.FirstName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     e.LastName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     e.Email.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(e => e.IsActive == isActive);
        }

        var list = query
            .OrderBy(e => e.EmployeeCode)
            .Select(employee => new EmployeeDto(
                employee.Id,
                employee.CompanyId,
                employee.Company != null ? employee.Company.LegalName : null,
                employee.BranchId,
                employee.Branch != null ? employee.Branch.Name : null,
                employee.DepartmentId,
                employee.Department != null ? employee.Department.Name : null,
                employee.DesignationId,
                employee.Designation != null ? employee.Designation.Title : null,
                employee.EmployeeCode,
                employee.FirstName,
                employee.LastName,
                $"{employee.FirstName} {employee.LastName}",
                employee.Email,
                employee.Phone,
                employee.JoiningDate,
                employee.Salary,
                employee.IsActive,
                employee.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<EmployeeDto>>(list);
    }
}

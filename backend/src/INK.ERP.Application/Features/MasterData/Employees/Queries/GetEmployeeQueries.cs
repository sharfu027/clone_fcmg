using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Employees.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Employees.Queries;

public record GetEmployeeByIdQuery(Guid Id) : IRequest<Result<EmployeeDto>>;

public class GetEmployeeByIdQueryHandler : IRequestHandler<GetEmployeeByIdQuery, Result<EmployeeDto>>
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetEmployeeByIdQueryHandler(IEmployeeRepository employeeRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<EmployeeDto>> Handle(GetEmployeeByIdQuery request, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (employee == null)
        {
            return Result<EmployeeDto>.Failure(Error.NotFound("Employee.NotFound", $"Employee with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(employee.CompanyId, cancellationToken))
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
            employee.WarehouseId,
            employee.Warehouse?.Name,
            employee.Warehouse?.Code,
            employee.DesignationId,
            employee.Designation?.Title,
            employee.EmployeeRoleId,
            employee.EmployeeRole?.Name,
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
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetEmployeesPagedQueryHandler(IEmployeeRepository employeeRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<EmployeeDto>>> Handle(GetEmployeesPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<EmployeeDto>>(new List<EmployeeDto>());
        }

        var employees = await _employeeRepository.GetAllWithDetailsAsync(cancellationToken);
        var query = employees.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(e => e.CompanyId == effectiveCompanyId.Value);
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
                                     e.Email.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     e.Phone.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     (e.EmployeeRole != null && e.EmployeeRole.Name.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                                     (e.Warehouse != null && e.Warehouse.Name.Contains(search, StringComparison.OrdinalIgnoreCase)));
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
                employee.WarehouseId,
                employee.Warehouse != null ? employee.Warehouse.Name : null,
                employee.Warehouse != null ? employee.Warehouse.Code : null,
                employee.DesignationId,
                employee.Designation != null ? employee.Designation.Title : null,
                employee.EmployeeRoleId,
                employee.EmployeeRole != null ? employee.EmployeeRole.Name : null,
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

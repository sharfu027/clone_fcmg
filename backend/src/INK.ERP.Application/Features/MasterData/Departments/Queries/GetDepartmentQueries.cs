using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Departments.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Departments.Queries;

public record GetDepartmentByIdQuery(Guid Id) : IRequest<Result<DepartmentDto>>;

public class GetDepartmentByIdQueryHandler : IRequestHandler<GetDepartmentByIdQuery, Result<DepartmentDto>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDepartmentByIdQueryHandler(
        IDepartmentRepository departmentRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<DepartmentDto>> Handle(GetDepartmentByIdQuery request, CancellationToken cancellationToken)
    {
        var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (department == null)
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Department.NotFound", $"Department with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(department.CompanyId, cancellationToken))
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Department.NotFound", $"Department with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(department.CompanyId, cancellationToken);
        var branch = department.BranchId.HasValue ? await _branchRepository.GetByIdAsync(department.BranchId.Value, cancellationToken) : null;
        Employee? manager = null;
        if (department.ManagerEmployeeId.HasValue)
        {
            manager = await _employeeRepository.GetByIdWithDetailsAsync(department.ManagerEmployeeId.Value, cancellationToken);
        }

        var dto = new DepartmentDto(
            department.Id,
            department.CompanyId,
            company?.LegalName,
            department.BranchId,
            branch?.Name ?? department.Branch?.Name,
            department.Code,
            department.Name,
            department.Description,
            department.IsActive,
            department.ManagerEmployeeId,
            manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
            manager?.EmployeeCode,
            department.CreatedAtUtc);

        return Result<DepartmentDto>.Success(dto);
    }
}

public record GetDepartmentsPagedQuery(
    Guid? CompanyId = null,
    Guid? BranchId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<DepartmentDto>>>;

public class GetDepartmentsPagedQueryHandler : IRequestHandler<GetDepartmentsPagedQuery, Result<IReadOnlyList<DepartmentDto>>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDepartmentsPagedQueryHandler(
        IDepartmentRepository departmentRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<DepartmentDto>>> Handle(GetDepartmentsPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<DepartmentDto>>(new List<DepartmentDto>());
        }

        var departments = await _departmentRepository.GetAllAsync(cancellationToken);
        var query = departments.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(d => d.CompanyId == effectiveCompanyId.Value);
        }

        if (request.BranchId.HasValue)
        {
            query = query.Where(d => d.BranchId == request.BranchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(d => d.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     d.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(d => d.IsActive == isActive);
        }

        var companies = await _companyRepository.GetAllAsync(cancellationToken);
        var compMap = companies.ToDictionary(c => c.Id, c => c.LegalName);

        var branches = await _branchRepository.GetAllAsync(cancellationToken);
        var branchMap = branches.ToDictionary(b => b.Id, b => b.Name);

        var allEmployees = await _employeeRepository.GetAllAsync(cancellationToken);
        var empMap = allEmployees.ToDictionary(e => e.Id, e => e);

        var list = query
            .OrderBy(d => d.Code)
            .AsEnumerable()
            .Select(department => {
                Employee? manager = null;
                if (department.ManagerEmployeeId.HasValue && empMap.TryGetValue(department.ManagerEmployeeId.Value, out var emp))
                {
                    manager = emp;
                }

                return new DepartmentDto(
                    department.Id,
                    department.CompanyId,
                    compMap.TryGetValue(department.CompanyId, out var cName) ? cName : null,
                    department.BranchId,
                    department.BranchId.HasValue && branchMap.TryGetValue(department.BranchId.Value, out var bName) ? bName : (department.Branch?.Name),
                    department.Code,
                    department.Name,
                    department.Description,
                    department.IsActive,
                    department.ManagerEmployeeId,
                    manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
                    manager?.EmployeeCode,
                    department.CreatedAtUtc);
            })
            .ToList();

        return Result.Success<IReadOnlyList<DepartmentDto>>(list);
    }
}

using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Departments.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Departments.Queries;

public record GetDepartmentByIdQuery(Guid Id) : IRequest<Result<DepartmentDto>>;

public class GetDepartmentByIdQueryHandler : IRequestHandler<GetDepartmentByIdQuery, Result<DepartmentDto>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDepartmentByIdQueryHandler(
        IDepartmentRepository departmentRepository,
        IBranchRepository branchRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _branchRepository = branchRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<DepartmentDto>> Handle(GetDepartmentByIdQuery request, CancellationToken cancellationToken)
    {
        var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (department == null)
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Department.NotFound", $"Department with ID '{request.Id}' was not found."));
        }

        var branch = await _branchRepository.GetByIdAsync(department.BranchId, cancellationToken);
        if (branch != null && !await _companyAccessResolver.HasAccessToCompanyAsync(branch.CompanyId, cancellationToken))
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Department.NotFound", $"Department with ID '{request.Id}' was not found."));
        }

        var dto = new DepartmentDto(
            department.Id,
            department.BranchId,
            branch?.Name ?? department.Branch?.Name,
            department.Code,
            department.Name,
            department.Description,
            department.IsActive,
            department.CreatedAtUtc);

        return Result<DepartmentDto>.Success(dto);
    }
}

public record GetDepartmentsPagedQuery(
    Guid? BranchId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<DepartmentDto>>>;

public class GetDepartmentsPagedQueryHandler : IRequestHandler<GetDepartmentsPagedQuery, Result<IReadOnlyList<DepartmentDto>>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDepartmentsPagedQueryHandler(
        IDepartmentRepository departmentRepository,
        IBranchRepository branchRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _branchRepository = branchRepository;
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

        if (authorizedCompanyId.HasValue)
        {
            var branches = await _branchRepository.GetAllAsync(cancellationToken);
            var validBranchIds = branches.Where(b => !b.IsDeleted && b.CompanyId == authorizedCompanyId.Value).Select(b => b.Id).ToHashSet();
            query = query.Where(d => validBranchIds.Contains(d.BranchId));
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

        var list = query
            .OrderBy(d => d.Code)
            .Select(department => new DepartmentDto(
                department.Id,
                department.BranchId,
                department.Branch != null ? department.Branch.Name : null,
                department.Code,
                department.Name,
                department.Description,
                department.IsActive,
                department.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<DepartmentDto>>(list);
    }
}

using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Branches.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Branches.Queries;

public record GetBranchByIdQuery(Guid Id) : IRequest<Result<BranchDto>>;

public class GetBranchByIdQueryHandler : IRequestHandler<GetBranchByIdQuery, Result<BranchDto>>
{
    private readonly IBranchRepository _branchRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetBranchByIdQueryHandler(
        IBranchRepository branchRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _branchRepository = branchRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<BranchDto>> Handle(GetBranchByIdQuery request, CancellationToken cancellationToken)
    {
        var branch = await _branchRepository.GetByIdAsync(request.Id, cancellationToken);
        if (branch == null || branch.IsDeleted)
        {
            return Result<BranchDto>.Failure(Error.NotFound("Branch.NotFound", $"Branch with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(branch.CompanyId, cancellationToken))
        {
            return Result<BranchDto>.Failure(Error.NotFound("Branch.NotFound", $"Branch with ID '{request.Id}' was not found."));
        }

        Employee? manager = null;
        if (branch.ManagerEmployeeId.HasValue)
        {
            manager = await _employeeRepository.GetByIdWithDetailsAsync(branch.ManagerEmployeeId.Value, cancellationToken);
        }

        var dto = new BranchDto(
            branch.Id,
            branch.CompanyId,
            branch.Company?.LegalName,
            branch.Code,
            branch.Name,
            branch.Gstin,
            branch.Email,
            branch.Phone,
            branch.Address.AddressLine1,
            branch.Address.AddressLine2,
            branch.Address.City,
            branch.Address.State,
            branch.Address.PostalCode,
            branch.Address.Country,
            branch.IsHeadquarters,
            branch.IsActive,
            branch.ManagerEmployeeId,
            manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
            manager?.EmployeeCode,
            branch.CreatedAtUtc);

        return Result<BranchDto>.Success(dto);
    }
}

public record GetBranchesPagedQuery(
    Guid? CompanyId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<BranchDto>>>;

public class GetBranchesPagedQueryHandler : IRequestHandler<GetBranchesPagedQuery, Result<IReadOnlyList<BranchDto>>>
{
    private readonly IBranchRepository _branchRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetBranchesPagedQueryHandler(
        IBranchRepository branchRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _branchRepository = branchRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<BranchDto>>> Handle(GetBranchesPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<BranchDto>>(new List<BranchDto>());
        }

        var branches = await _branchRepository.GetAllAsync(cancellationToken);
        var query = branches.Where(b => !b.IsDeleted).AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(b => b.CompanyId == effectiveCompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(b => b.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     b.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     b.Gstin.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(b => b.IsActive == isActive);
        }

        var allEmployees = await _employeeRepository.GetAllAsync(cancellationToken);
        var employeeMap = allEmployees.ToDictionary(e => e.Id, e => e);

        var list = query
            .OrderBy(b => b.Code)
            .AsEnumerable()
            .Select(branch => {
                Employee? manager = null;
                if (branch.ManagerEmployeeId.HasValue && employeeMap.TryGetValue(branch.ManagerEmployeeId.Value, out var emp))
                {
                    manager = emp;
                }

                return new BranchDto(
                    branch.Id,
                    branch.CompanyId,
                    branch.Company != null ? branch.Company.LegalName : null,
                    branch.Code,
                    branch.Name,
                    branch.Gstin,
                    branch.Email,
                    branch.Phone,
                    branch.Address.AddressLine1,
                    branch.Address.AddressLine2,
                    branch.Address.City,
                    branch.Address.State,
                    branch.Address.PostalCode,
                    branch.Address.Country,
                    branch.IsHeadquarters,
                    branch.IsActive,
                    branch.ManagerEmployeeId,
                    manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
                    manager?.EmployeeCode,
                    branch.CreatedAtUtc);
            })
            .ToList();

        return Result.Success<IReadOnlyList<BranchDto>>(list);
    }
}

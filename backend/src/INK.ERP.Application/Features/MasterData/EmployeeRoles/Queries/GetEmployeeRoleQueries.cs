using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.EmployeeRoles.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.EmployeeRoles.Queries;

public record GetEmployeeRoleByIdQuery(Guid Id) : IRequest<Result<EmployeeRoleDto>>;

public class GetEmployeeRoleByIdQueryHandler : IRequestHandler<GetEmployeeRoleByIdQuery, Result<EmployeeRoleDto>>
{
    private readonly IEmployeeRoleRepository _employeeRoleRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetEmployeeRoleByIdQueryHandler(IEmployeeRoleRepository employeeRoleRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRoleRepository = employeeRoleRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<EmployeeRoleDto>> Handle(GetEmployeeRoleByIdQuery request, CancellationToken cancellationToken)
    {
        var role = await _employeeRoleRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (role == null)
        {
            return Result<EmployeeRoleDto>.Failure(Error.NotFound("EmployeeRole.NotFound", $"Employee role with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(role.CompanyId, cancellationToken))
        {
            return Result<EmployeeRoleDto>.Failure(Error.NotFound("EmployeeRole.NotFound", $"Employee role with ID '{request.Id}' was not found."));
        }

        var dto = new EmployeeRoleDto(
            role.Id,
            role.CompanyId,
            role.Company?.LegalName,
            role.Code,
            role.Name,
            role.Description,
            role.IsActive,
            role.CreatedAtUtc);

        return Result<EmployeeRoleDto>.Success(dto);
    }
}

public record GetEmployeeRolesPagedQuery(
    Guid? CompanyId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<EmployeeRoleDto>>>;

public class GetEmployeeRolesPagedQueryHandler : IRequestHandler<GetEmployeeRolesPagedQuery, Result<IReadOnlyList<EmployeeRoleDto>>>
{
    private readonly IEmployeeRoleRepository _employeeRoleRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetEmployeeRolesPagedQueryHandler(IEmployeeRoleRepository employeeRoleRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRoleRepository = employeeRoleRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<EmployeeRoleDto>>> Handle(GetEmployeeRolesPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<EmployeeRoleDto>>(new List<EmployeeRoleDto>());
        }

        var roles = await _employeeRoleRepository.GetAllWithDetailsAsync(cancellationToken);
        var query = roles.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(r => r.CompanyId == effectiveCompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(r => r.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     r.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     (r.Description != null && r.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(r => r.IsActive == isActive);
        }

        var list = query
            .OrderBy(r => r.Code)
            .Select(role => new EmployeeRoleDto(
                role.Id,
                role.CompanyId,
                role.Company != null ? role.Company.LegalName : null,
                role.Code,
                role.Name,
                role.Description,
                role.IsActive,
                role.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<EmployeeRoleDto>>(list);
    }
}

using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Branches.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Branches.Queries;

public record GetBranchByIdQuery(Guid Id) : IRequest<Result<BranchDto>>;

public class GetBranchByIdQueryHandler : IRequestHandler<GetBranchByIdQuery, Result<BranchDto>>
{
    private readonly IBranchRepository _branchRepository;

    public GetBranchByIdQueryHandler(IBranchRepository branchRepository)
    {
        _branchRepository = branchRepository;
    }

    public async Task<Result<BranchDto>> Handle(GetBranchByIdQuery request, CancellationToken cancellationToken)
    {
        var branch = await _branchRepository.GetByIdAsync(request.Id, cancellationToken);
        if (branch == null)
        {
            return Result<BranchDto>.Failure(Error.NotFound("Branch.NotFound", $"Branch with ID '{request.Id}' was not found."));
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

    public GetBranchesPagedQueryHandler(IBranchRepository branchRepository)
    {
        _branchRepository = branchRepository;
    }

    public async Task<Result<IReadOnlyList<BranchDto>>> Handle(GetBranchesPagedQuery request, CancellationToken cancellationToken)
    {
        var branches = await _branchRepository.GetAllAsync(cancellationToken);
        var query = branches.AsQueryable();

        if (request.CompanyId.HasValue)
        {
            query = query.Where(b => b.CompanyId == request.CompanyId.Value);
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

        var list = query
            .OrderBy(b => b.Code)
            .Select(branch => new BranchDto(
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
                branch.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<BranchDto>>(list);
    }
}

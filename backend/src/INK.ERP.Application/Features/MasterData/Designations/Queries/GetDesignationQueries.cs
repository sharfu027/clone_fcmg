using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Designations.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Designations.Queries;

public record GetDesignationByIdQuery(Guid Id) : IRequest<Result<DesignationDto>>;

public class GetDesignationByIdQueryHandler : IRequestHandler<GetDesignationByIdQuery, Result<DesignationDto>>
{
    private readonly IDesignationRepository _designationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDesignationByIdQueryHandler(IDesignationRepository designationRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _designationRepository = designationRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<DesignationDto>> Handle(GetDesignationByIdQuery request, CancellationToken cancellationToken)
    {
        var designation = await _designationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (designation == null)
        {
            return Result<DesignationDto>.Failure(Error.NotFound("Designation.NotFound", $"Designation with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(designation.CompanyId, cancellationToken))
        {
            return Result<DesignationDto>.Failure(Error.NotFound("Designation.NotFound", $"Designation with ID '{request.Id}' was not found."));
        }

        var dto = new DesignationDto(
            designation.Id,
            designation.CompanyId,
            designation.Company?.LegalName,
            designation.Code,
            designation.Title,
            designation.Level,
            designation.ApprovalLimit,
            designation.IsActive,
            designation.CreatedAtUtc);

        return Result<DesignationDto>.Success(dto);
    }
}

public record GetDesignationsPagedQuery(
    Guid? CompanyId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<DesignationDto>>>;

public class GetDesignationsPagedQueryHandler : IRequestHandler<GetDesignationsPagedQuery, Result<IReadOnlyList<DesignationDto>>>
{
    private readonly IDesignationRepository _designationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDesignationsPagedQueryHandler(IDesignationRepository designationRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _designationRepository = designationRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<DesignationDto>>> Handle(GetDesignationsPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<DesignationDto>>(new List<DesignationDto>());
        }

        var designations = await _designationRepository.GetAllAsync(cancellationToken);
        var query = designations.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(d => d.CompanyId == effectiveCompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(d => d.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     d.Title.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(d => d.IsActive == isActive);
        }

        var list = query
            .OrderBy(d => d.Code)
            .Select(designation => new DesignationDto(
                designation.Id,
                designation.CompanyId,
                designation.Company != null ? designation.Company.LegalName : null,
                designation.Code,
                designation.Title,
                designation.Level,
                designation.ApprovalLimit,
                designation.IsActive,
                designation.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<DesignationDto>>(list);
    }
}

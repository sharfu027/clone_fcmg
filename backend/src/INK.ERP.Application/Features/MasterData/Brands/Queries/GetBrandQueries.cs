using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Brands.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Brands.Queries;

public record GetBrandByIdQuery(Guid Id) : IRequest<Result<BrandDto>>;

public class GetBrandByIdQueryHandler : IRequestHandler<GetBrandByIdQuery, Result<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetBrandByIdQueryHandler(IBrandRepository brandRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _brandRepository = brandRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<BrandDto>> Handle(GetBrandByIdQuery request, CancellationToken cancellationToken)
    {
        var brand = await _brandRepository.GetByIdAsync(request.Id, cancellationToken);
        if (brand == null)
        {
            return Result<BrandDto>.Failure(Error.NotFound("Brand.NotFound", $"Brand with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(brand.CompanyId, cancellationToken))
        {
            return Result<BrandDto>.Failure(Error.NotFound("Brand.NotFound", $"Brand with ID '{request.Id}' was not found."));
        }

        var dto = new BrandDto(
            brand.Id,
            brand.CompanyId,
            brand.Company?.LegalName,
            brand.Code,
            brand.Name,
            brand.ManufacturerName,
            brand.OriginCountry,
            brand.IsActive,
            brand.CreatedAtUtc);

        return Result<BrandDto>.Success(dto);
    }
}

public record GetBrandsPagedQuery(
    Guid? CompanyId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<BrandDto>>>;

public class GetBrandsPagedQueryHandler : IRequestHandler<GetBrandsPagedQuery, Result<IReadOnlyList<BrandDto>>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetBrandsPagedQueryHandler(IBrandRepository brandRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _brandRepository = brandRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<BrandDto>>> Handle(GetBrandsPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<BrandDto>>(new List<BrandDto>());
        }

        var brands = await _brandRepository.GetAllAsync(cancellationToken);
        var query = brands.AsQueryable();

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
                                     (!string.IsNullOrEmpty(b.ManufacturerName) && b.ManufacturerName.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(b => b.IsActive == isActive);
        }

        var list = query
            .OrderBy(b => b.Code)
            .Select(brand => new BrandDto(
                brand.Id,
                brand.CompanyId,
                brand.Company != null ? brand.Company.LegalName : null,
                brand.Code,
                brand.Name,
                brand.ManufacturerName,
                brand.OriginCountry,
                brand.IsActive,
                brand.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<BrandDto>>(list);
    }
}

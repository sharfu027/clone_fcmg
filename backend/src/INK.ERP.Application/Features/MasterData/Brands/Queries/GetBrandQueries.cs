using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Brands.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Brands.Queries;

public record GetBrandByIdQuery(Guid Id) : IRequest<Result<BrandDto>>;

public class GetBrandByIdQueryHandler : IRequestHandler<GetBrandByIdQuery, Result<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;

    public GetBrandByIdQueryHandler(IBrandRepository brandRepository)
    {
        _brandRepository = brandRepository;
    }

    public async Task<Result<BrandDto>> Handle(GetBrandByIdQuery request, CancellationToken cancellationToken)
    {
        var brand = await _brandRepository.GetByIdAsync(request.Id, cancellationToken);
        if (brand == null)
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

    public GetBrandsPagedQueryHandler(IBrandRepository brandRepository)
    {
        _brandRepository = brandRepository;
    }

    public async Task<Result<IReadOnlyList<BrandDto>>> Handle(GetBrandsPagedQuery request, CancellationToken cancellationToken)
    {
        var brands = await _brandRepository.GetAllAsync(cancellationToken);
        var query = brands.AsQueryable();

        if (request.CompanyId.HasValue)
        {
            query = query.Where(b => b.CompanyId == request.CompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(b => b.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     b.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
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

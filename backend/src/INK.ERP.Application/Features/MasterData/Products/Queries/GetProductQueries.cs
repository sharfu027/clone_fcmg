using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Products.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Products.Queries;

public record GetProductByIdQuery(Guid Id) : IRequest<Result<ProductDto>>;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, Result<ProductDto>>
{
    private readonly IProductRepository _productRepository;

    public GetProductByIdQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.Id, cancellationToken);
        if (product == null)
        {
            return Result<ProductDto>.Failure(Error.NotFound("Product.NotFound", $"Product with ID '{request.Id}' was not found."));
        }

        var dto = new ProductDto(
            product.Id,
            product.CompanyId,
            product.Company?.LegalName,
            product.CategoryId,
            product.Category?.Name,
            product.BrandId,
            product.Brand?.Name,
            product.BaseUomId,
            product.BaseUom?.Code,
            product.Code,
            product.Name,
            product.Sku,
            product.Barcode,
            product.HsnCode,
            product.GstRatePercent,
            product.Mrp,
            product.BasePrice,
            product.MinOrderQty,
            product.ShelfLifeDays,
            product.IsBatchTracked,
            product.IsActive,
            product.CreatedAtUtc);

        return Result<ProductDto>.Success(dto);
    }
}

public record GetProductsPagedQuery(
    Guid? CompanyId = null,
    Guid? CategoryId = null,
    Guid? BrandId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<ProductDto>>>;

public class GetProductsPagedQueryHandler : IRequestHandler<GetProductsPagedQuery, Result<IReadOnlyList<ProductDto>>>
{
    private readonly IProductRepository _productRepository;

    public GetProductsPagedQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<IReadOnlyList<ProductDto>>> Handle(GetProductsPagedQuery request, CancellationToken cancellationToken)
    {
        var products = await _productRepository.GetAllAsync(cancellationToken);
        var query = products.AsQueryable();

        if (request.CompanyId.HasValue)
        {
            query = query.Where(p => p.CompanyId == request.CompanyId.Value);
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

        if (request.BrandId.HasValue)
        {
            query = query.Where(p => p.BrandId == request.BrandId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(p => p.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     p.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     p.Sku.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     (!string.IsNullOrEmpty(p.Barcode) && p.Barcode.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                                     p.HsnCode.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(p => p.IsActive == isActive);
        }

        var list = query
            .OrderBy(p => p.Code)
            .Select(product => new ProductDto(
                product.Id,
                product.CompanyId,
                product.Company != null ? product.Company.LegalName : null,
                product.CategoryId,
                product.Category != null ? product.Category.Name : null,
                product.BrandId,
                product.Brand != null ? product.Brand.Name : null,
                product.BaseUomId,
                product.BaseUom != null ? product.BaseUom.Code : null,
                product.Code,
                product.Name,
                product.Sku,
                product.Barcode,
                product.HsnCode,
                product.GstRatePercent,
                product.Mrp,
                product.BasePrice,
                product.MinOrderQty,
                product.ShelfLifeDays,
                product.IsBatchTracked,
                product.IsActive,
                product.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<ProductDto>>(list);
    }
}

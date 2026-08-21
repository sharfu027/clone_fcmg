using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Products.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Products.Commands;

public record CreateProductCommand(
    Guid CompanyId,
    Guid CategoryId,
    Guid? BrandId,
    Guid BaseUomId,
    string Code,
    string Name,
    string Sku,
    string? Barcode,
    string HsnCode,
    decimal GstRatePercent,
    decimal Mrp,
    decimal BasePrice,
    decimal MinOrderQty,
    int? ShelfLifeDays,
    bool IsBatchTracked) : IRequest<Result<ProductDto>>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IBrandRepository _brandRepository;
    private readonly IUnitOfMeasureRepository _uomRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateProductCommandHandler(
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        ICategoryRepository categoryRepository,
        IBrandRepository brandRepository,
        IUnitOfMeasureRepository uomRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _categoryRepository = categoryRepository;
        _brandRepository = brandRepository;
        _uomRepository = uomRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<ProductDto>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<ProductDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<ProductDto>.Failure(Error.NotFound("Company.NotFound", $"Target Company was not found or is inactive."));
        }

        // Category may be a Root Category OR a Subcategory — Subcategory is OPTIONAL.
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken);
        if (category == null || !category.IsActive || category.CompanyId != targetCompanyId)
        {
            return Result<ProductDto>.Failure(Error.Validation("Product.InvalidCategory", "The selected category does not exist or does not belong to the authorized company."));
        }

        // Brand is OPTIONAL. When provided, must belong to the authorized company.
        Brand? brand = null;
        if (request.BrandId.HasValue)
        {
            brand = await _brandRepository.GetByIdAsync(request.BrandId.Value, cancellationToken);
            if (brand == null || !brand.IsActive || brand.CompanyId != targetCompanyId)
            {
                return Result<ProductDto>.Failure(Error.Validation("Product.InvalidBrand", "The selected brand does not exist or does not belong to the authorized company."));
            }
        }

        var uom = await _uomRepository.GetByIdAsync(request.BaseUomId, cancellationToken);
        if (uom == null || !uom.IsActive || uom.CompanyId != targetCompanyId)
        {
            return Result<ProductDto>.Failure(Error.Validation("Product.InvalidUom", "The selected unit of measure does not exist or does not belong to the authorized company."));
        }

        if (!await _productRepository.IsCodeUniqueAsync(company.Id, request.Code, null, cancellationToken))
        {
            return Result<ProductDto>.Failure(Error.Conflict("Product.DuplicateCode", $"Product code '{request.Code}' already exists under company '{company.LegalName}'. Please use a unique code."));
        }

        if (!await _productRepository.IsSkuUniqueAsync(company.Id, request.Sku, null, cancellationToken))
        {
            return Result<ProductDto>.Failure(Error.Conflict("Product.DuplicateSku", $"Product SKU '{request.Sku}' already exists under company '{company.LegalName}'. Please use a unique SKU."));
        }

        var product = new Product
        {
            CompanyId = company.Id,
            CategoryId = category.Id,
            BrandId = request.BrandId,
            BaseUomId = uom.Id,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            Sku = request.Sku.ToUpperInvariant().Trim(),
            Barcode = request.Barcode?.Trim(),
            HsnCode = request.HsnCode.Trim(),
            GstRatePercent = request.GstRatePercent,
            Mrp = request.Mrp,
            BasePrice = request.BasePrice,
            MinOrderQty = request.MinOrderQty <= 0 ? 1.0m : request.MinOrderQty,
            ShelfLifeDays = request.ShelfLifeDays,
            IsBatchTracked = request.IsBatchTracked,
            IsActive = true
        };

        try
        {
            await _productRepository.AddAsync(product, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            var detailMsg = ex.InnerException?.Message ?? ex.Message;
            if (detailMsg.Contains("23505") || detailMsg.ToLower().Contains("unique") || detailMsg.ToLower().Contains("duplicate"))
            {
                return Result<ProductDto>.Failure(Error.Conflict("Product.DuplicateRecord", $"Product code '{request.Code}' or SKU '{request.Sku}' already exists."));
            }
            return Result<ProductDto>.Failure(Error.Failure("Product.SaveError", $"Failed to save product: {detailMsg}"));
        }

        var parentCategory = category.ParentCategoryId.HasValue
            ? await _categoryRepository.GetByIdAsync(category.ParentCategoryId.Value, cancellationToken)
            : null;

        var dto = new ProductDto(
            product.Id,
            product.CompanyId,
            company.LegalName,
            product.CategoryId,
            category.Name,
            category.ParentCategoryId,
            parentCategory?.Name,
            product.BrandId,
            brand?.Name,
            product.BaseUomId,
            uom.Code,
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

public record UpdateProductCommand(
    Guid Id,
    Guid CompanyId,
    Guid CategoryId,
    Guid? BrandId,
    Guid BaseUomId,
    string Code,
    string Name,
    string Sku,
    string? Barcode,
    string HsnCode,
    decimal GstRatePercent,
    decimal Mrp,
    decimal BasePrice,
    decimal MinOrderQty,
    int? ShelfLifeDays,
    bool IsBatchTracked,
    bool IsActive) : IRequest<Result<ProductDto>>;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IBrandRepository _brandRepository;
    private readonly IUnitOfMeasureRepository _uomRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateProductCommandHandler(
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        ICategoryRepository categoryRepository,
        IBrandRepository brandRepository,
        IUnitOfMeasureRepository uomRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _categoryRepository = categoryRepository;
        _brandRepository = brandRepository;
        _uomRepository = uomRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.Id, cancellationToken);
        if (product == null)
        {
            return Result<ProductDto>.Failure(Error.NotFound("Product.NotFound", $"Product with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(product.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<ProductDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(product.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<ProductDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company was not found."));
        }

        // Category may be a Root Category OR a Subcategory — Subcategory is OPTIONAL.
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken);
        if (category == null || !category.IsActive || category.CompanyId != product.CompanyId)
        {
            return Result<ProductDto>.Failure(Error.Validation("Product.InvalidCategory", "The selected category does not exist or does not belong to the authorized company."));
        }

        // Brand is OPTIONAL. When provided, must belong to the authorized company.
        Brand? brand = null;
        if (request.BrandId.HasValue)
        {
            brand = await _brandRepository.GetByIdAsync(request.BrandId.Value, cancellationToken);
            if (brand == null || !brand.IsActive || brand.CompanyId != product.CompanyId)
            {
                return Result<ProductDto>.Failure(Error.Validation("Product.InvalidBrand", "The selected brand does not exist or does not belong to the authorized company."));
            }
        }

        var uom = await _uomRepository.GetByIdAsync(request.BaseUomId, cancellationToken);
        if (uom == null || !uom.IsActive || uom.CompanyId != product.CompanyId)
        {
            return Result<ProductDto>.Failure(Error.Validation("Product.InvalidUom", "The selected unit of measure does not exist or does not belong to the authorized company."));
        }

        if (!await _productRepository.IsCodeUniqueAsync(product.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<ProductDto>.Failure(Error.Conflict("Product.DuplicateCode", $"Product code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        if (!await _productRepository.IsSkuUniqueAsync(product.CompanyId, request.Sku, request.Id, cancellationToken))
        {
            return Result<ProductDto>.Failure(Error.Conflict("Product.DuplicateSku", $"Product SKU '{request.Sku}' already exists under company '{company.LegalName}'."));
        }

        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.BaseUomId = request.BaseUomId;
        product.Code = request.Code.ToUpperInvariant().Trim();
        product.Name = request.Name.Trim();
        product.Sku = request.Sku.ToUpperInvariant().Trim();
        product.Barcode = request.Barcode?.Trim();
        product.HsnCode = request.HsnCode.Trim();
        product.GstRatePercent = request.GstRatePercent;
        product.Mrp = request.Mrp;
        product.BasePrice = request.BasePrice;
        product.MinOrderQty = request.MinOrderQty <= 0 ? 1.0m : request.MinOrderQty;
        product.ShelfLifeDays = request.ShelfLifeDays;
        product.IsBatchTracked = request.IsBatchTracked;
        product.IsActive = request.IsActive;

        await _productRepository.UpdateAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var parentCategory = category.ParentCategoryId.HasValue
            ? await _categoryRepository.GetByIdAsync(category.ParentCategoryId.Value, cancellationToken)
            : null;

        var dto = new ProductDto(
            product.Id,
            product.CompanyId,
            company.LegalName,
            product.CategoryId,
            category.Name,
            category.ParentCategoryId,
            parentCategory?.Name,
            product.BrandId,
            brand?.Name,
            product.BaseUomId,
            uom.Code,
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

public record DeleteProductCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, Result<Unit>>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteProductCommandHandler(
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.Id, cancellationToken);
        if (product == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Product.NotFound", $"Product with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(product.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        await _productRepository.DeleteAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}

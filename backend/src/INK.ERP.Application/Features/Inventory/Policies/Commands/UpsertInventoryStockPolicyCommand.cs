using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Policies.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.Inventory.Policies.Commands;

public record UpsertInventoryStockPolicyCommand(
    Guid CompanyId,
    Guid InventoryLocationId,
    Guid ProductId,
    decimal MinStockQuantity,
    decimal? ReorderPoint = null,
    decimal? ReorderQuantity = null) : IRequest<Result<InventoryStockPolicyDto>>;

public class UpsertInventoryStockPolicyCommandHandler : IRequestHandler<UpsertInventoryStockPolicyCommand, Result<InventoryStockPolicyDto>>
{
    private readonly IInventoryStockPolicyRepository _policyRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public UpsertInventoryStockPolicyCommandHandler(
        IInventoryStockPolicyRepository policyRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _policyRepository = policyRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _companyAccessResolver = companyAccessResolver;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<InventoryStockPolicyDto>> Handle(UpsertInventoryStockPolicyCommand request, CancellationToken cancellationToken)
    {
        var location = await _locationRepository.GetByIdAsync(request.InventoryLocationId, cancellationToken);
        if (location == null)
            return Result<InventoryStockPolicyDto>.Failure(Error.NotFound("InventoryLocation.NotFound", "Inventory location not found."));

        var targetCompanyId = request.CompanyId != Guid.Empty ? request.CompanyId : location.CompanyId;
        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(targetCompanyId);
        if (!hasAccess)
            return Result<InventoryStockPolicyDto>.Failure(Error.Unauthorized("IAM.Unauthorized", "Unauthorized access to company stock policy."));

        var product = await _productRepository.GetByIdWithDetailsAsync(request.ProductId, cancellationToken);
        if (product == null)
            return Result<InventoryStockPolicyDto>.Failure(Error.NotFound("Product.NotFound", "Product not found."));

        if (request.MinStockQuantity < 0)
            return Result<InventoryStockPolicyDto>.Failure(Error.Validation("StockPolicy.NegativeMinStock", "Minimum stock quantity cannot be negative."));

        var policy = await _policyRepository.UpsertPolicyAsync(
            targetCompanyId,
            request.InventoryLocationId,
            request.ProductId,
            request.MinStockQuantity,
            request.ReorderPoint,
            request.ReorderQuantity,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);

        var dto = new InventoryStockPolicyDto(
            policy.Id,
            policy.CompanyId,
            company?.LegalName,
            policy.InventoryLocationId,
            location.Name,
            location.Code,
            policy.ProductId,
            product.Name,
            product.Code,
            product.Sku,
            policy.MinStockQuantity,
            policy.ReorderPoint,
            policy.ReorderQuantity,
            policy.IsActive,
            policy.CreatedAtUtc,
            policy.LastModifiedAtUtc);

        return Result<InventoryStockPolicyDto>.Success(dto);
    }
}

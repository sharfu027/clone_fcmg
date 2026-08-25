using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Balances.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Balances.Commands;

public record CreateInventoryBalanceCommand(
    Guid CompanyId,
    Guid InventoryLocationId,
    Guid ProductId,
    decimal OpeningQuantity) : IRequest<Result<InventoryBalanceDto>>;

public class CreateInventoryBalanceCommandHandler : IRequestHandler<CreateInventoryBalanceCommand, Result<InventoryBalanceDto>>
{
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateInventoryBalanceCommandHandler(
        IInventoryBalanceRepository balanceRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _balanceRepository = balanceRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryBalanceDto>> Handle(CreateInventoryBalanceCommand request, CancellationToken cancellationToken)
    {
        // 1. Resolve authorized company
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        // 2. Validate Company
        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<InventoryBalanceDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        // 3. Validate OpeningQuantity >= 0
        if (request.OpeningQuantity < 0)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation("InventoryBalance.InvalidQuantity", "Opening stock quantity cannot be negative."));
        }

        // 4. Validate InventoryLocation
        var location = await _locationRepository.GetByIdAsync(request.InventoryLocationId, cancellationToken);
        if (location == null || location.CompanyId != targetCompanyId)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation("InventoryBalance.InvalidLocation", "The selected inventory location does not exist or does not belong to the authorized company."));
        }

        if (!location.IsActive)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation("InventoryBalance.InactiveLocation", "The selected inventory location is inactive."));
        }

        // 5. Validate Product
        var product = await _productRepository.GetByIdWithDetailsAsync(request.ProductId, cancellationToken);
        if (product == null || product.CompanyId != targetCompanyId)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation("InventoryBalance.InvalidProduct", "The selected product does not exist or does not belong to the authorized company."));
        }

        if (!product.IsActive)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation("InventoryBalance.InactiveProduct", "The selected product is inactive."));
        }

        if (product.BaseUomId == Guid.Empty || product.BaseUom == null)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation("InventoryBalance.MissingUom", "The selected product does not have a valid Base Unit of Measure."));
        }

        // 6. Validate uniqueness (one balance record per location per product in company)
        if (await _balanceRepository.ExistsAsync(targetCompanyId, request.InventoryLocationId, request.ProductId, cancellationToken))
        {
            return Result<InventoryBalanceDto>.Failure(Error.Conflict("InventoryBalance.DuplicateRecord", $"An inventory balance record already exists for product '{product.Name}' at location '{location.Name}'."));
        }

        // 7. Create balance
        var balance = new InventoryBalance
        {
            CompanyId = targetCompanyId,
            InventoryLocationId = request.InventoryLocationId,
            ProductId = request.ProductId,
            OnHandQuantity = request.OpeningQuantity,
            ReservedQuantity = 0m,
            AllocatedQuantity = 0m,
            LastMovementAtUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _balanceRepository.AddAsync(balance, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        decimal availableQty = balance.OnHandQuantity - balance.ReservedQuantity - balance.AllocatedQuantity;

        var dto = new InventoryBalanceDto(
            balance.Id,
            balance.CompanyId,
            company.LegalName,
            balance.InventoryLocationId,
            location.Name,
            location.Code,
            balance.ProductId,
            product.Name,
            product.Code,
            product.Sku,
            product.BaseUomId,
            product.BaseUom.Name,
            balance.OnHandQuantity,
            balance.ReservedQuantity,
            balance.AllocatedQuantity,
            availableQty,
            balance.LastMovementAtUtc,
            balance.CreatedAtUtc,
            balance.LastModifiedAtUtc);

        return Result<InventoryBalanceDto>.Success(dto);
    }
}

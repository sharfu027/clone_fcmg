using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Transactions.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.Inventory.Transactions.Commands;

public record PostInventoryTransactionCommand(
    Guid CompanyId,
    Guid InventoryLocationId,
    Guid ProductId,
    string TransactionType,
    decimal Quantity,
    string? ReferenceDocumentType = null,
    Guid? ReferenceDocumentId = null,
    string? ReferenceDocumentNumber = null,
    string? BatchNumber = null,
    DateTime? ExpiryDate = null,
    Guid? PerformedByEmployeeId = null,
    string? Notes = null) : ICommand<Result<InventoryTransactionDto>>;

public class PostInventoryTransactionCommandHandler : IRequestHandler<PostInventoryTransactionCommand, Result<InventoryTransactionDto>>
{
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public PostInventoryTransactionCommandHandler(
        IInventoryTransactionRepository transactionRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _transactionRepository = transactionRepository;
        _balanceRepository = balanceRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryTransactionDto>> Handle(PostInventoryTransactionCommand request, CancellationToken cancellationToken)
    {
        // 1. Resolve authorized company
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<InventoryTransactionDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        // 2. Validate Company
        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<InventoryTransactionDto>.Failure(Error.NotFound("Company.NotFound", $"Target Company was not found or is inactive."));
        }

        // 3. Validate Quantity > 0
        if (request.Quantity <= 0)
        {
            return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.InvalidQuantity", "Transaction quantity must be greater than zero."));
        }

        // 4. Validate TransactionType
        if (!InventoryTransactionTypes.IsValid(request.TransactionType))
        {
            return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.InvalidType", $"Transaction type '{request.TransactionType}' is not valid. Allowed types: {string.Join(", ", InventoryTransactionTypes.All)}."));
        }

        var normalizedType = request.TransactionType.Trim();

        // 5. Validate InventoryLocation
        var location = await _locationRepository.GetByIdAsync(request.InventoryLocationId, cancellationToken);
        if (location == null || location.CompanyId != targetCompanyId)
        {
            return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.InvalidLocation", "The selected inventory location does not exist or does not belong to the authorized company."));
        }

        if (!location.IsActive)
        {
            return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.InactiveLocation", "The selected inventory location is inactive."));
        }

        // 6. Validate Product
        var product = await _productRepository.GetByIdWithDetailsAsync(request.ProductId, cancellationToken);
        if (product == null || product.CompanyId != targetCompanyId)
        {
            return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.InvalidProduct", "The selected product does not exist or does not belong to the authorized company."));
        }

        if (!product.IsActive)
        {
            return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.InactiveProduct", "The selected product is inactive."));
        }

        if (product.BaseUomId == Guid.Empty || product.BaseUom == null)
        {
            return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.MissingUom", "The selected product does not have a valid Base Unit of Measure."));
        }

        // 7. Validate Employee if provided
        Employee? employee = null;
        if (request.PerformedByEmployeeId.HasValue && request.PerformedByEmployeeId.Value != Guid.Empty)
        {
            employee = await _employeeRepository.GetByIdWithDetailsAsync(request.PerformedByEmployeeId.Value, cancellationToken);
            if (employee == null || !employee.IsActive || employee.CompanyId != targetCompanyId)
            {
                return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.InvalidEmployee", "The performing employee does not exist, is inactive, or does not belong to the authorized company."));
            }
        }

        // 8. Validate Batch/Expiry & Normalize
        string? normalizedBatch = string.IsNullOrWhiteSpace(request.BatchNumber) ? null : request.BatchNumber.Trim().ToUpperInvariant();
        DateTime? normalizedExpiry = request.ExpiryDate?.Date;

        if (product.IsBatchTracked && string.IsNullOrWhiteSpace(normalizedBatch))
        {
            return Result<InventoryTransactionDto>.Failure(Error.Validation("InventoryTransaction.BatchRequired", $"Product '{product.Name}' is batch-tracked. A Batch Number is required."));
        }

        // Validate that if this batch already exists, it does not have a conflicting expiry date
        if (!string.IsNullOrWhiteSpace(normalizedBatch) && normalizedExpiry.HasValue)
        {
            var existingTxns = await _transactionRepository.GetByBalanceContextAsync(targetCompanyId, request.InventoryLocationId, request.ProductId, cancellationToken);
            var conflictingTxn = existingTxns.FirstOrDefault(t =>
                !string.IsNullOrWhiteSpace(t.BatchNumber) &&
                t.BatchNumber.Trim().ToUpperInvariant() == normalizedBatch &&
                t.ExpiryDate.HasValue &&
                t.ExpiryDate.Value.Date != normalizedExpiry.Value);

            if (conflictingTxn != null && conflictingTxn.ExpiryDate.HasValue)
            {
                return Result<InventoryTransactionDto>.Failure(Error.Validation(
                    "InventoryTransaction.ConflictingBatchExpiry",
                    $"Batch '{normalizedBatch}' already exists with a different Expiry Date ({conflictingTxn.ExpiryDate.Value:yyyy-MM-dd})."));
            }
        }

        // 9. Process atomic inventory update matching on (CompanyId, LocationId, ProductId, normalizedBatch)
        var balance = await _balanceRepository.GetByLocationProductAndBatchAsync(targetCompanyId, request.InventoryLocationId, request.ProductId, normalizedBatch, cancellationToken);

        bool isNewBalance = false;
        if (balance == null)
        {
            balance = new InventoryBalance
            {
                CompanyId = targetCompanyId,
                InventoryLocationId = request.InventoryLocationId,
                ProductId = request.ProductId,
                BatchNumber = normalizedBatch,
                ExpiryDate = normalizedExpiry,
                OnHandQuantity = 0m,
                ReservedQuantity = 0m,
                AllocatedQuantity = 0m,
                LastMovementAtUtc = DateTime.UtcNow,
                CreatedAtUtc = DateTime.UtcNow
            };
            isNewBalance = true;
        }
        else if (normalizedExpiry.HasValue && !balance.ExpiryDate.HasValue)
        {
            balance.ExpiryDate = normalizedExpiry;
        }

        // Calculate additive / signed stock change
        decimal signedFactor = InventoryTransactionTypes.GetSignedFactor(normalizedType);
        decimal signedDelta = request.Quantity * signedFactor;
        decimal newOnHand = balance.OnHandQuantity + signedDelta;

        if (newOnHand < 0)
        {
            string batchDesc = normalizedBatch != null ? $" for batch '{normalizedBatch}'" : string.Empty;
            return Result<InventoryTransactionDto>.Failure(Error.Validation(
                "InventoryTransaction.InsufficientStock",
                $"Available stock{batchDesc} is {balance.OnHandQuantity:0.####}, requested reduction is {request.Quantity:0.####}."));
        }

        balance.OnHandQuantity = newOnHand;
        balance.LastMovementAtUtc = DateTime.UtcNow;

        if (isNewBalance)
        {
            await _balanceRepository.AddAsync(balance, cancellationToken);
        }
        else
        {
            await _balanceRepository.UpdateAsync(balance, cancellationToken);
        }

        var txn = new InventoryTransaction
        {
            CompanyId = targetCompanyId,
            InventoryLocationId = request.InventoryLocationId,
            ProductId = request.ProductId,
            TransactionType = normalizedType,
            Quantity = request.Quantity,
            BalanceAfter = balance.OnHandQuantity,
            ReferenceDocumentType = request.ReferenceDocumentType?.Trim(),
            ReferenceDocumentId = request.ReferenceDocumentId,
            ReferenceDocumentNumber = request.ReferenceDocumentNumber?.Trim(),
            BatchNumber = normalizedBatch,
            ExpiryDate = normalizedExpiry ?? balance.ExpiryDate,
            PerformedByEmployeeId = request.PerformedByEmployeeId,
            Notes = request.Notes?.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        await _transactionRepository.AddAsync(txn, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        decimal signedQty = txn.Quantity * InventoryTransactionTypes.GetSignedFactor(txn.TransactionType);
        string? employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : null;

        var dto = new InventoryTransactionDto(
            txn.Id,
            txn.CompanyId,
            company.LegalName,
            txn.InventoryLocationId,
            location.Name,
            location.Code,
            txn.ProductId,
            product.Name,
            product.Code,
            product.Sku,
            product.BaseUomId,
            product.BaseUom.Name,
            txn.TransactionType,
            txn.Quantity,
            signedQty,
            txn.BalanceAfter,
            txn.ReferenceDocumentType,
            txn.ReferenceDocumentId,
            txn.ReferenceDocumentNumber,
            txn.BatchNumber,
            txn.ExpiryDate,
            txn.PerformedByEmployeeId,
            employeeName,
            txn.Notes,
            txn.CreatedAtUtc);

        return Result<InventoryTransactionDto>.Success(dto);
    }
}

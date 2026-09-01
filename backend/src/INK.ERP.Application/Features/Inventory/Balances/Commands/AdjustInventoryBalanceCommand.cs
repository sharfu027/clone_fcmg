using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Balances.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Balances.Commands;

public record AdjustInventoryBalanceCommand(
    Guid BalanceId,
    decimal NewOnHandQuantity,
    string? BatchNumber = null,
    DateTime? ExpiryDate = null,
    string? Reason = null,
    bool ReleaseExcessReservations = true,
    decimal? MinStockQuantity = null) : IRequest<Result<InventoryBalanceDto>>;

public class AdjustInventoryBalanceCommandHandler : IRequestHandler<AdjustInventoryBalanceCommand, Result<InventoryBalanceDto>>
{
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryStockPolicyRepository _policyRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public AdjustInventoryBalanceCommandHandler(
        IInventoryBalanceRepository balanceRepository,
        IInventoryStockPolicyRepository policyRepository,
        IInventoryTransactionRepository transactionRepository,
        IInventoryReservationRepository reservationRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _balanceRepository = balanceRepository;
        _policyRepository = policyRepository;
        _transactionRepository = transactionRepository;
        _reservationRepository = reservationRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryBalanceDto>> Handle(AdjustInventoryBalanceCommand request, CancellationToken cancellationToken)
    {
        // 1. Resolve authorized company
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account."));
        }

        // 2. Locate balance record
        var balance = await _balanceRepository.GetByIdAsync(request.BalanceId, cancellationToken);
        if (balance == null || (authorizedCompanyId.HasValue && balance.CompanyId != authorizedCompanyId.Value))
        {
            return Result<InventoryBalanceDto>.Failure(Error.NotFound("InventoryBalance.NotFound", $"Inventory balance record with ID '{request.BalanceId}' was not found."));
        }

        // 3. Validate new quantity
        if (request.NewOnHandQuantity < 0)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation("InventoryBalance.NegativeQuantity", "Total stock quantity cannot be negative."));
        }

        if (request.NewOnHandQuantity < balance.AllocatedQuantity)
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation(
                "InventoryBalance.BelowAllocatedStock",
                $"Cannot reduce stock below active pick allocations ({balance.AllocatedQuantity:0.####})."));
        }

        decimal lockedStock = balance.ReservedQuantity + balance.AllocatedQuantity;
        if (request.NewOnHandQuantity < lockedStock)
        {
            if (request.ReleaseExcessReservations)
            {
                decimal maxAllowedReserved = Math.Max(0m, request.NewOnHandQuantity - balance.AllocatedQuantity);
                decimal excessToRelease = balance.ReservedQuantity - maxAllowedReserved;

                var activeReservations = await _reservationRepository.GetActiveReservationsForProductAndLocationAsync(
                    balance.CompanyId,
                    balance.InventoryLocationId,
                    balance.ProductId,
                    cancellationToken);

                decimal releasedSoFar = 0m;
                foreach (var resv in activeReservations)
                {
                    if (releasedSoFar >= excessToRelease) break;

                    decimal availableInResv = resv.ReservedQuantity;
                    if (availableInResv <= (excessToRelease - releasedSoFar))
                    {
                        resv.Status = InventoryReservationStatuses.Released;
                        resv.ReleasedAtUtc = DateTime.UtcNow;
                        resv.LastModifiedAtUtc = DateTime.UtcNow;
                        releasedSoFar += availableInResv;
                    }
                    else
                    {
                        resv.ReservedQuantity -= (excessToRelease - releasedSoFar);
                        resv.LastModifiedAtUtc = DateTime.UtcNow;
                        releasedSoFar = excessToRelease;
                    }
                    await _reservationRepository.UpdateAsync(resv, cancellationToken);
                }

                balance.ReservedQuantity = maxAllowedReserved;
            }
            else
            {
                return Result<InventoryBalanceDto>.Failure(Error.Validation(
                    "InventoryBalance.BelowLockedStock",
                    $"Cannot reduce stock below locked quantities. Reserved: {balance.ReservedQuantity:0.####}, Allocated: {balance.AllocatedQuantity:0.####}. Please enable 'Release Excess Reservations' to proceed."));
            }
        }

        var product = await _productRepository.GetByIdWithDetailsAsync(balance.ProductId, cancellationToken);
        if (product == null)
        {
            return Result<InventoryBalanceDto>.Failure(Error.NotFound("Product.NotFound", "Product associated with this balance was not found."));
        }

        var location = await _locationRepository.GetByIdAsync(balance.InventoryLocationId, cancellationToken);
        var company = await _companyRepository.GetByIdAsync(balance.CompanyId, cancellationToken);

        string? normalizedBatch = string.IsNullOrWhiteSpace(request.BatchNumber)
            ? balance.BatchNumber
            : request.BatchNumber.Trim().ToUpperInvariant();

        if (product.IsBatchTracked && string.IsNullOrWhiteSpace(normalizedBatch))
        {
            return Result<InventoryBalanceDto>.Failure(Error.Validation("InventoryBalance.BatchRequired", $"Product '{product.Name}' is batch-tracked. A Batch Number is required."));
        }

        DateTime? normalizedExpiry = request.ExpiryDate?.Date ?? balance.ExpiryDate;

        // 4. Calculate delta
        decimal oldOnHand = balance.OnHandQuantity;
        decimal delta = request.NewOnHandQuantity - oldOnHand;
        string notes = !string.IsNullOrWhiteSpace(request.Reason)
            ? request.Reason.Trim()
            : $"Manual stock adjustment: {oldOnHand:0.####} -> {request.NewOnHandQuantity:0.####}";

        // 5. Create immutable inventory transaction in ledger
        string txnType;
        decimal txnQty;

        if (delta > 0)
        {
            txnType = InventoryTransactionTypes.AdjustmentIncrease;
            txnQty = delta;
        }
        else if (delta < 0)
        {
            txnType = InventoryTransactionTypes.AdjustmentDecrease;
            txnQty = Math.Abs(delta);
        }
        else
        {
            // Delta is 0 (e.g. metadata or batch correction)
            txnType = InventoryTransactionTypes.AdjustmentIncrease;
            txnQty = 0m;
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                notes = "Batch metadata / expiry date updated";
            }
        }

        balance.OnHandQuantity = request.NewOnHandQuantity;
        balance.BatchNumber = normalizedBatch;
        balance.ExpiryDate = normalizedExpiry;
        if (request.MinStockQuantity.HasValue && request.MinStockQuantity.Value >= 0)
        {
            balance.MinStockQuantity = request.MinStockQuantity.Value;
        }
        balance.LastMovementAtUtc = DateTime.UtcNow;

        await _balanceRepository.UpdateAsync(balance, cancellationToken);

        var txn = new InventoryTransaction
        {
            CompanyId = balance.CompanyId,
            InventoryLocationId = balance.InventoryLocationId,
            ProductId = balance.ProductId,
            TransactionType = txnType,
            Quantity = txnQty,
            BalanceAfter = balance.OnHandQuantity,
            BatchNumber = normalizedBatch,
            ExpiryDate = normalizedExpiry,
            Notes = notes,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _transactionRepository.AddAsync(txn, cancellationToken);

        // 6. Update Stock Policy if MinStockQuantity was provided
        if (request.MinStockQuantity.HasValue && request.MinStockQuantity.Value >= 0)
        {
            await _policyRepository.UpsertPolicyAsync(
                balance.CompanyId,
                balance.InventoryLocationId,
                balance.ProductId,
                request.MinStockQuantity.Value,
                cancellationToken: cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        decimal availableQty = balance.OnHandQuantity - balance.ReservedQuantity - balance.AllocatedQuantity;

        var allBalances = await _balanceRepository.GetByLocationAndProductListAsync(balance.CompanyId, balance.InventoryLocationId, balance.ProductId, cancellationToken);
        decimal totalLocationAvailable = allBalances.Sum(b => Math.Max(0m, b.OnHandQuantity - b.ReservedQuantity - b.AllocatedQuantity));

        var policy = await _policyRepository.GetPolicyAsync(balance.CompanyId, balance.InventoryLocationId, balance.ProductId, cancellationToken);
        decimal minStock = policy?.MinStockQuantity ?? (product?.MinOrderQty ?? 0m);

        var dto = new InventoryBalanceDto(
            balance.Id,
            balance.CompanyId,
            company?.LegalName,
            balance.InventoryLocationId,
            location?.Name,
            location?.Code,
            balance.ProductId,
            product?.Name,
            product?.Code,
            product?.Sku,
            product?.BaseUomId ?? Guid.Empty,
            product?.BaseUom?.Name,
            balance.BatchNumber,
            balance.ExpiryDate,
            balance.OnHandQuantity,
            balance.ReservedQuantity,
            balance.AllocatedQuantity,
            availableQty,
            balance.LastMovementAtUtc,
            balance.CreatedAtUtc,
            balance.LastModifiedAtUtc,
            minStock,
            totalLocationAvailable);

        return Result<InventoryBalanceDto>.Success(dto);
    }
}

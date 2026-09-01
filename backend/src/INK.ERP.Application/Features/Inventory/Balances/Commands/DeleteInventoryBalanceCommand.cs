using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Balances.Commands;

public record DeleteInventoryBalanceCommand(
    Guid BalanceId,
    string? Reason = null,
    bool ReleaseReservations = true) : IRequest<Result<Unit>>;

public class DeleteInventoryBalanceCommandHandler : IRequestHandler<DeleteInventoryBalanceCommand, Result<Unit>>
{
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteInventoryBalanceCommandHandler(
        IInventoryBalanceRepository balanceRepository,
        IInventoryTransactionRepository transactionRepository,
        IInventoryReservationRepository reservationRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _balanceRepository = balanceRepository;
        _transactionRepository = transactionRepository;
        _reservationRepository = reservationRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteInventoryBalanceCommand request, CancellationToken cancellationToken)
    {
        // 1. Resolve authorized company
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<Unit>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account."));
        }

        // 2. Locate balance record
        var balance = await _balanceRepository.GetByIdAsync(request.BalanceId, cancellationToken);
        if (balance == null || (authorizedCompanyId.HasValue && balance.CompanyId != authorizedCompanyId.Value))
        {
            return Result<Unit>.Failure(Error.NotFound("InventoryBalance.NotFound", $"Inventory balance record with ID '{request.BalanceId}' was not found."));
        }

        // 3. Handle active reservations / allocations
        if (balance.AllocatedQuantity > 0)
        {
            return Result<Unit>.Failure(Error.Validation(
                "InventoryBalance.CannotDeleteAllocatedStock",
                $"Cannot remove a stock balance record with active pick allocations ({balance.AllocatedQuantity:0.####}). Please complete or cancel pending pick/pack tasks first."));
        }

        if (balance.ReservedQuantity > 0)
        {
            if (request.ReleaseReservations)
            {
                var activeReservations = await _reservationRepository.GetActiveReservationsForProductAndLocationAsync(
                    balance.CompanyId,
                    balance.InventoryLocationId,
                    balance.ProductId,
                    cancellationToken);

                foreach (var resv in activeReservations)
                {
                    resv.Status = InventoryReservationStatuses.Released;
                    resv.ReleasedAtUtc = DateTime.UtcNow;
                    resv.LastModifiedAtUtc = DateTime.UtcNow;
                    await _reservationRepository.UpdateAsync(resv, cancellationToken);
                }

                balance.ReservedQuantity = 0m;
            }
            else
            {
                return Result<Unit>.Failure(Error.Validation(
                    "InventoryBalance.CannotDeleteReservedStock",
                    $"Cannot remove stock balance because {balance.ReservedQuantity:0.####} units are currently reserved. Please enable 'Release Reservations' to confirm removal."));
            }
        }

        // 4. Zero out ledger if stock remains
        if (balance.OnHandQuantity > 0)
        {
            string notes = !string.IsNullOrWhiteSpace(request.Reason)
                ? request.Reason.Trim()
                : $"Stock balance record deleted: {balance.OnHandQuantity:0.####} units cleared from inventory";

            var txn = new InventoryTransaction
            {
                CompanyId = balance.CompanyId,
                InventoryLocationId = balance.InventoryLocationId,
                ProductId = balance.ProductId,
                TransactionType = InventoryTransactionTypes.AdjustmentDecrease,
                Quantity = balance.OnHandQuantity,
                BalanceAfter = 0m,
                BatchNumber = balance.BatchNumber,
                ExpiryDate = balance.ExpiryDate,
                Notes = notes,
                CreatedAtUtc = DateTime.UtcNow
            };

            await _transactionRepository.AddAsync(txn, cancellationToken);
        }

        // 5. Delete balance record
        await _balanceRepository.DeleteAsync(balance, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}

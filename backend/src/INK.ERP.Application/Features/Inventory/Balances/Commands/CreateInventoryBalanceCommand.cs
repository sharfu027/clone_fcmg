using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Balances.DTOs;
using INK.ERP.Application.Features.Inventory.Transactions.Commands;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Balances.Commands;

public record CreateInventoryBalanceCommand(
    Guid CompanyId,
    Guid InventoryLocationId,
    Guid ProductId,
    decimal OpeningQuantity,
    string? BatchNumber = null,
    DateTime? ExpiryDate = null,
    decimal? MinStockQuantity = null) : IRequest<Result<InventoryBalanceDto>>;

public class CreateInventoryBalanceCommandHandler : IRequestHandler<CreateInventoryBalanceCommand, Result<InventoryBalanceDto>>
{
    private readonly ISender _mediator;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryStockPolicyRepository _policyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateInventoryBalanceCommandHandler(
        ISender mediator,
        IInventoryBalanceRepository balanceRepository,
        IInventoryStockPolicyRepository policyRepository,
        IUnitOfWork unitOfWork)
    {
        _mediator = mediator;
        _balanceRepository = balanceRepository;
        _policyRepository = policyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<InventoryBalanceDto>> Handle(CreateInventoryBalanceCommand request, CancellationToken cancellationToken)
    {
        // Route through PostInventoryTransactionCommand to ensure 100% immutable ledger tracking and concurrency integrity
        var postCmd = new PostInventoryTransactionCommand(
            CompanyId: request.CompanyId,
            InventoryLocationId: request.InventoryLocationId,
            ProductId: request.ProductId,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: request.OpeningQuantity,
            BatchNumber: request.BatchNumber,
            ExpiryDate: request.ExpiryDate,
            Notes: "Opening stock balance established");

        var result = await _mediator.Send(postCmd, cancellationToken);
        if (!result.IsSuccess || result.Value == null)
        {
            return Result<InventoryBalanceDto>.Failure(result.Error);
        }

        if (request.MinStockQuantity.HasValue && request.MinStockQuantity.Value >= 0)
        {
            await _policyRepository.UpsertPolicyAsync(
                result.Value.CompanyId,
                result.Value.InventoryLocationId,
                result.Value.ProductId,
                request.MinStockQuantity.Value,
                cancellationToken: cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var balance = await _balanceRepository.GetByLocationProductAndBatchAsync(
            result.Value.CompanyId,
            result.Value.InventoryLocationId,
            result.Value.ProductId,
            result.Value.BatchNumber,
            cancellationToken);

        if (balance == null)
        {
            return Result<InventoryBalanceDto>.Failure(Error.NotFound("InventoryBalance.NotFound", "Balance record could not be retrieved after transaction posting."));
        }

        decimal availableQty = balance.OnHandQuantity - balance.ReservedQuantity - balance.AllocatedQuantity;

        var allBalances = await _balanceRepository.GetByLocationAndProductListAsync(balance.CompanyId, balance.InventoryLocationId, balance.ProductId, cancellationToken);
        decimal totalLocationAvailable = allBalances.Sum(b => Math.Max(0m, b.OnHandQuantity - b.ReservedQuantity - b.AllocatedQuantity));

        var policy = await _policyRepository.GetPolicyAsync(balance.CompanyId, balance.InventoryLocationId, balance.ProductId, cancellationToken);
        decimal minStock = policy?.MinStockQuantity ?? 0m;

        var dto = new InventoryBalanceDto(
            balance.Id,
            balance.CompanyId,
            result.Value.CompanyName,
            balance.InventoryLocationId,
            result.Value.InventoryLocationName,
            result.Value.InventoryLocationCode,
            balance.ProductId,
            result.Value.ProductName,
            result.Value.ProductCode,
            result.Value.Sku,
            result.Value.BaseUomId,
            result.Value.BaseUomName,
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

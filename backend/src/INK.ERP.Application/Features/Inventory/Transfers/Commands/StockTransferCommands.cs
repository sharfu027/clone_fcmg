using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Transfers.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Features.Inventory.Transfers.Commands;

// ----------------------------------------------------
// 1. CREATE STOCK TRANSFER COMMAND (Destination Requests from Source)
// ----------------------------------------------------
public record CreateStockTransferCommand(
    Guid CompanyId,
    Guid SourceLocationId,
    Guid DestinationLocationId,
    Guid? SalesOrderId,
    Guid RequestedByEmployeeId,
    string? Notes,
    List<CreateStockTransferLineRequest> Lines
) : IRequest<Result<StockTransferDto>>;

public class CreateStockTransferCommandHandler : IRequestHandler<CreateStockTransferCommand, Result<StockTransferDto>>
{
    private readonly IStockTransferRepository _transferRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ISalesOrderRepository _orderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ILocationAuthorizationService _locationAuthService;
    private readonly IUnitOfWork _unitOfWork;

    public CreateStockTransferCommandHandler(
        IStockTransferRepository transferRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        IEmployeeRepository employeeRepository,
        ISalesOrderRepository orderRepository,
        ICompanyAccessResolver companyAccessResolver,
        ILocationAuthorizationService locationAuthService,
        IUnitOfWork unitOfWork)
    {
        _transferRepository = transferRepository ?? throw new ArgumentNullException(nameof(transferRepository));
        _locationRepository = locationRepository ?? throw new ArgumentNullException(nameof(locationRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _locationAuthService = locationAuthService ?? throw new ArgumentNullException(nameof(locationAuthService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<StockTransferDto>> Handle(CreateStockTransferCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.EmptyCompany", "Company ID is required."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<StockTransferDto>.Failure(Error.Unauthorized("Transfer.Unauthorized", "Unauthorized access to requested company."));

        if (request.SourceLocationId == request.DestinationLocationId)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.SameLocation", "Source and destination locations must be different."));

        if (request.Lines == null || request.Lines.Count == 0)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.EmptyLines", "Transfer must contain at least one line item."));

        // Validate Destination Location Authority (Requesting Location)
        var destAuth = await _locationAuthService.AuthorizeLocationAccessAsync(
            request.CompanyId,
            request.DestinationLocationId,
            "Request",
            request.RequestedByEmployeeId,
            cancellationToken);

        if (!destAuth.IsSuccess)
            return Result<StockTransferDto>.Failure(destAuth.Error);

        // Validate Source Location exists, is active, and belongs to same company
        var srcLoc = await _locationRepository.GetByIdAsync(request.SourceLocationId, cancellationToken);
        if (srcLoc == null || srcLoc.CompanyId != request.CompanyId)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.SourceNotFound", "Source inventory location not found or does not belong to specified company."));
        if (!srcLoc.IsActive)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InactiveSource", "Source inventory location is inactive."));

        // Validate Destination Location exists & is active
        var dstLoc = await _locationRepository.GetByIdAsync(request.DestinationLocationId, cancellationToken);
        if (dstLoc == null || dstLoc.CompanyId != request.CompanyId)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.DestNotFound", "Destination inventory location not found or does not belong to specified company."));
        if (!dstLoc.IsActive)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InactiveDest", "Destination inventory location is inactive."));

        // Validate Requesting Employee
        var emp = await _employeeRepository.GetByIdAsync(request.RequestedByEmployeeId, cancellationToken);
        if (emp == null || emp.CompanyId != request.CompanyId)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.EmployeeNotFound", "Requesting employee not found or does not belong to specified company."));
        if (!emp.IsActive)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InactiveEmployee", "Requesting employee is inactive."));

        // Validate optional Sales Order
        if (request.SalesOrderId.HasValue && request.SalesOrderId.Value != Guid.Empty)
        {
            var order = await _orderRepository.GetByIdAsync(request.SalesOrderId.Value, cancellationToken);
            if (order == null || order.CompanyId != request.CompanyId)
                return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.OrderNotFound", "Linked sales order not found or does not belong to specified company."));
        }

        // Validate Products and Quantities
        var lines = new List<StockTransferLine>();
        foreach (var l in request.Lines)
        {
            if (l.RequestedQuantity <= 0)
                return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InvalidQuantity", "Requested quantity must be strictly positive (> 0)."));

            var prod = await _productRepository.GetByIdAsync(l.ProductId, cancellationToken);
            if (prod == null || prod.CompanyId != request.CompanyId)
                return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.ProductNotFound", $"Product {l.ProductId} not found or does not belong to specified company."));
            if (!prod.IsActive)
                return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InactiveProduct", $"Product '{prod.Name}' is inactive."));

            lines.Add(new StockTransferLine
            {
                Id = Guid.NewGuid(),
                ProductId = l.ProductId,
                RequestedQuantity = l.RequestedQuantity,
                ApprovedQuantity = l.RequestedQuantity,
                DispatchedQuantity = 0m,
                ReceivedQuantity = 0m,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        string transferNumber = await _transferRepository.GetNextTransferNumberAsync(request.CompanyId, cancellationToken);

        var transfer = new StockTransfer
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            TransferNumber = transferNumber,
            SourceLocationId = request.SourceLocationId,
            DestinationLocationId = request.DestinationLocationId,
            SalesOrderId = request.SalesOrderId,
            Status = StockTransferStatuses.Requested,
            RequestedByEmployeeId = request.RequestedByEmployeeId,
            Notes = request.Notes,
            CreatedAtUtc = DateTime.UtcNow,
            Lines = lines
        };

        await _transferRepository.AddAsync(transfer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _transferRepository.GetByIdWithDetailsAsync(transfer.Id, cancellationToken);
        return Result.Success(MapToDto(created!));
    }

    private static StockTransferDto MapToDto(StockTransfer t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.TransferNumber,
        t.SourceLocationId,
        t.SourceLocation?.Name ?? "Source",
        t.SourceLocation?.Code ?? "SRC",
        t.DestinationLocationId,
        t.DestinationLocation?.Name ?? "Dest",
        t.DestinationLocation?.Code ?? "DST",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber,
        t.Status,
        t.RequestedByEmployeeId,
        t.RequestedByEmployee != null ? $"{t.RequestedByEmployee.FirstName} {t.RequestedByEmployee.LastName}".Trim() : "Employee",
        t.ApprovedByEmployeeId,
        t.ApprovedByEmployee != null ? $"{t.ApprovedByEmployee.FirstName} {t.ApprovedByEmployee.LastName}".Trim() : null,
        t.DispatchedAtUtc,
        t.ReceivedAtUtc,
        t.Notes,
        t.CreatedAtUtc,
        t.LastModifiedAtUtc,
        t.Lines.Select(l => new StockTransferLineDto(
            l.Id,
            l.StockTransferId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.ApprovedQuantity,
            l.DispatchedQuantity,
            l.ReceivedQuantity,
            Math.Max(0m, l.DispatchedQuantity - l.ReceivedQuantity),
            l.CreatedAtUtc
        )).ToList()
    );
}

// ----------------------------------------------------
// 2. APPROVE STOCK TRANSFER COMMAND (Source Location Scope Required)
// ----------------------------------------------------
public record ApproveStockTransferCommand(
    Guid Id,
    Guid ApprovedByEmployeeId,
    List<ApproveTransferLineItem>? LineApprovals = null,
    Guid? CompanyId = null
) : IRequest<Result<StockTransferDto>>;

public class ApproveStockTransferCommandHandler : IRequestHandler<ApproveStockTransferCommand, Result<StockTransferDto>>
{
    private readonly IStockTransferRepository _transferRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ILocationAuthorizationService _locationAuthService;
    private readonly IUnitOfWork _unitOfWork;

    public ApproveStockTransferCommandHandler(
        IStockTransferRepository transferRepository,
        IEmployeeRepository employeeRepository,
        IInventoryBalanceRepository balanceRepository,
        ICompanyAccessResolver companyAccessResolver,
        ILocationAuthorizationService locationAuthService,
        IUnitOfWork unitOfWork)
    {
        _transferRepository = transferRepository ?? throw new ArgumentNullException(nameof(transferRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _locationAuthService = locationAuthService ?? throw new ArgumentNullException(nameof(locationAuthService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<StockTransferDto>> Handle(ApproveStockTransferCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InvalidId", "Transfer ID is required."));

        var transfer = await _transferRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (transfer == null)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.NotFound", "Stock transfer not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(transfer.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<StockTransferDto>.Failure(Error.Unauthorized("Transfer.Unauthorized", "Unauthorized access to requested company transfer."));

        // Status check & concurrency protection
        if (transfer.Status != StockTransferStatuses.Requested)
            return Result<StockTransferDto>.Failure(Error.Conflict("Transfer.InvalidStatus", $"Only 'Requested' transfers can be approved. Current status: '{transfer.Status}'."));

        // Authorize Source Location Scope (Supply Location)
        var srcAuth = await _locationAuthService.AuthorizeLocationAccessAsync(
            transfer.CompanyId,
            transfer.SourceLocationId,
            "Approve",
            request.ApprovedByEmployeeId,
            cancellationToken);

        if (!srcAuth.IsSuccess)
            return Result<StockTransferDto>.Failure(srcAuth.Error);

        var approver = await _employeeRepository.GetByIdAsync(request.ApprovedByEmployeeId, cancellationToken);
        if (approver == null || approver.CompanyId != transfer.CompanyId)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.ApproverNotFound", "Approving employee not found or does not belong to specified company."));
        if (!approver.IsActive)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InactiveApprover", "Approving employee is inactive."));

        // Validate available stock at source location for all lines
        foreach (var line in transfer.Lines)
        {
            decimal qtyToApprove = line.RequestedQuantity;
            if (request.LineApprovals != null)
            {
                var match = request.LineApprovals.FirstOrDefault(la => la.LineId == line.Id);
                if (match != null)
                {
                    qtyToApprove = match.ApprovedQuantity;
                }
            }

            if (qtyToApprove <= 0)
                return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InvalidApprovedQuantity", "Approved quantity must be strictly positive (> 0)."));

            var bal = await _balanceRepository.GetByLocationAndProductAsync(
                transfer.CompanyId,
                transfer.SourceLocationId,
                line.ProductId,
                cancellationToken);

            decimal onHand = bal?.OnHandQuantity ?? 0m;
            decimal reserved = bal?.ReservedQuantity ?? 0m;
            decimal allocated = bal?.AllocatedQuantity ?? 0m;
            decimal available = Math.Max(0m, onHand - reserved - allocated);

            if (available < qtyToApprove)
            {
                return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InsufficientSourceStock",
                    $"Insufficient available stock at source location for product {line.ProductId}. Available: {available}, Required: {qtyToApprove}."));
            }

            line.ApprovedQuantity = qtyToApprove;
            line.LastModifiedAtUtc = DateTime.UtcNow;
        }

        transfer.ApprovedByEmployeeId = request.ApprovedByEmployeeId;
        transfer.Status = StockTransferStatuses.Approved;
        transfer.LastModifiedAtUtc = DateTime.UtcNow;

        await _transferRepository.UpdateAsync(transfer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _transferRepository.GetByIdWithDetailsAsync(transfer.Id, cancellationToken);
        return Result.Success(MapToDto(updated!));
    }

    private static StockTransferDto MapToDto(StockTransfer t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.TransferNumber,
        t.SourceLocationId,
        t.SourceLocation?.Name ?? "Source",
        t.SourceLocation?.Code ?? "SRC",
        t.DestinationLocationId,
        t.DestinationLocation?.Name ?? "Dest",
        t.DestinationLocation?.Code ?? "DST",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber,
        t.Status,
        t.RequestedByEmployeeId,
        t.RequestedByEmployee != null ? $"{t.RequestedByEmployee.FirstName} {t.RequestedByEmployee.LastName}".Trim() : "Employee",
        t.ApprovedByEmployeeId,
        t.ApprovedByEmployee != null ? $"{t.ApprovedByEmployee.FirstName} {t.ApprovedByEmployee.LastName}".Trim() : null,
        t.DispatchedAtUtc,
        t.ReceivedAtUtc,
        t.Notes,
        t.CreatedAtUtc,
        t.LastModifiedAtUtc,
        t.Lines.Select(l => new StockTransferLineDto(
            l.Id,
            l.StockTransferId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.ApprovedQuantity,
            l.DispatchedQuantity,
            l.ReceivedQuantity,
            Math.Max(0m, l.DispatchedQuantity - l.ReceivedQuantity),
            l.CreatedAtUtc
        )).ToList()
    );
}

// ----------------------------------------------------
// 3. DISPATCH STOCK TRANSFER COMMAND (Source Location Scope Required)
// ----------------------------------------------------
public record DispatchStockTransferCommand(Guid Id, Guid? CompanyId = null) : IRequest<Result<StockTransferDto>>;

public class DispatchStockTransferCommandHandler : IRequestHandler<DispatchStockTransferCommand, Result<StockTransferDto>>
{
    private readonly IStockTransferRepository _transferRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ILocationAuthorizationService _locationAuthService;
    private readonly IUnitOfWork _unitOfWork;

    public DispatchStockTransferCommandHandler(
        IStockTransferRepository transferRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryTransactionRepository transactionRepository,
        ICompanyAccessResolver companyAccessResolver,
        ILocationAuthorizationService locationAuthService,
        IUnitOfWork unitOfWork)
    {
        _transferRepository = transferRepository ?? throw new ArgumentNullException(nameof(transferRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _transactionRepository = transactionRepository ?? throw new ArgumentNullException(nameof(transactionRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _locationAuthService = locationAuthService ?? throw new ArgumentNullException(nameof(locationAuthService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<StockTransferDto>> Handle(DispatchStockTransferCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InvalidId", "Transfer ID is required."));

        var transfer = await _transferRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (transfer == null)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.NotFound", "Stock transfer not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(transfer.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<StockTransferDto>.Failure(Error.Unauthorized("Transfer.Unauthorized", "Unauthorized access to requested company transfer."));

        // Status check & concurrency protection
        if (transfer.Status != StockTransferStatuses.Approved)
            return Result<StockTransferDto>.Failure(Error.Conflict("Transfer.InvalidStatus", $"Only 'Approved' transfers can be dispatched. Current status: '{transfer.Status}'."));

        // Authorize Source Location Scope (Supply Location)
        var srcAuth = await _locationAuthService.AuthorizeLocationAccessAsync(
            transfer.CompanyId,
            transfer.SourceLocationId,
            "Dispatch",
            cancellationToken: cancellationToken);

        if (!srcAuth.IsSuccess)
            return Result<StockTransferDto>.Failure(srcAuth.Error);

        // Atomic Physical Movement: Post TransferOut for each line
        foreach (var line in transfer.Lines)
        {
            if (line.ApprovedQuantity <= 0)
                return Result<StockTransferDto>.Failure(Error.Validation("Transfer.ZeroApprovedQuantity", "Cannot dispatch line with 0 approved quantity."));

            var bal = await _balanceRepository.GetByLocationAndProductAsync(
                transfer.CompanyId,
                transfer.SourceLocationId,
                line.ProductId,
                cancellationToken);

            if (bal == null || bal.OnHandQuantity < line.ApprovedQuantity)
            {
                return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InsufficientOnHand",
                    $"Insufficient OnHand quantity at source location for product {line.ProductId}. OnHand: {bal?.OnHandQuantity ?? 0}, Required: {line.ApprovedQuantity}."));
            }

            // Decrement Source OnHand
            bal.OnHandQuantity -= line.ApprovedQuantity;
            bal.LastModifiedAtUtc = DateTime.UtcNow;
            await _balanceRepository.UpdateAsync(bal, cancellationToken);

            // Create immutable TransferOut transaction
            var txn = new InventoryTransaction
            {
                Id = Guid.NewGuid(),
                CompanyId = transfer.CompanyId,
                InventoryLocationId = transfer.SourceLocationId,
                ProductId = line.ProductId,
                TransactionType = InventoryTransactionTypes.TransferOut,
                Quantity = line.ApprovedQuantity,
                BalanceAfter = bal.OnHandQuantity,
                ReferenceDocumentType = "TRF",
                ReferenceDocumentId = transfer.Id,
                ReferenceDocumentNumber = transfer.TransferNumber,
                PerformedByEmployeeId = transfer.ApprovedByEmployeeId ?? transfer.RequestedByEmployeeId,
                Notes = $"Transfer dispatch to {transfer.DestinationLocation?.Name ?? "destination"}",
                CreatedAtUtc = DateTime.UtcNow
            };
            await _transactionRepository.AddAsync(txn, cancellationToken);

            line.DispatchedQuantity = line.ApprovedQuantity;
            line.LastModifiedAtUtc = DateTime.UtcNow;
        }

        transfer.DispatchedAtUtc = DateTime.UtcNow;
        transfer.Status = StockTransferStatuses.InTransit;
        transfer.LastModifiedAtUtc = DateTime.UtcNow;

        await _transferRepository.UpdateAsync(transfer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _transferRepository.GetByIdWithDetailsAsync(transfer.Id, cancellationToken);
        return Result.Success(MapToDto(updated!));
    }

    private static StockTransferDto MapToDto(StockTransfer t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.TransferNumber,
        t.SourceLocationId,
        t.SourceLocation?.Name ?? "Source",
        t.SourceLocation?.Code ?? "SRC",
        t.DestinationLocationId,
        t.DestinationLocation?.Name ?? "Dest",
        t.DestinationLocation?.Code ?? "DST",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber,
        t.Status,
        t.RequestedByEmployeeId,
        t.RequestedByEmployee != null ? $"{t.RequestedByEmployee.FirstName} {t.RequestedByEmployee.LastName}".Trim() : "Employee",
        t.ApprovedByEmployeeId,
        t.ApprovedByEmployee != null ? $"{t.ApprovedByEmployee.FirstName} {t.ApprovedByEmployee.LastName}".Trim() : null,
        t.DispatchedAtUtc,
        t.ReceivedAtUtc,
        t.Notes,
        t.CreatedAtUtc,
        t.LastModifiedAtUtc,
        t.Lines.Select(l => new StockTransferLineDto(
            l.Id,
            l.StockTransferId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.ApprovedQuantity,
            l.DispatchedQuantity,
            l.ReceivedQuantity,
            Math.Max(0m, l.DispatchedQuantity - l.ReceivedQuantity),
            l.CreatedAtUtc
        )).ToList()
    );
}

// ----------------------------------------------------
// 4. RECEIVE STOCK TRANSFER COMMAND (Destination Location Scope Required)
// ----------------------------------------------------
public record ReceiveStockTransferCommand(
    Guid Id,
    List<ReceiveTransferLineItem>? LineReceipts = null,
    Guid? CompanyId = null
) : IRequest<Result<StockTransferDto>>;

public class ReceiveStockTransferCommandHandler : IRequestHandler<ReceiveStockTransferCommand, Result<StockTransferDto>>
{
    private readonly IStockTransferRepository _transferRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ISalesOrderRepository _orderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ILocationAuthorizationService _locationAuthService;
    private readonly IUnitOfWork _unitOfWork;

    public ReceiveStockTransferCommandHandler(
        IStockTransferRepository transferRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryTransactionRepository transactionRepository,
        IInventoryReservationRepository reservationRepository,
        ISalesOrderRepository orderRepository,
        ICompanyAccessResolver companyAccessResolver,
        ILocationAuthorizationService locationAuthService,
        IUnitOfWork unitOfWork)
    {
        _transferRepository = transferRepository ?? throw new ArgumentNullException(nameof(transferRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _transactionRepository = transactionRepository ?? throw new ArgumentNullException(nameof(transactionRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _locationAuthService = locationAuthService ?? throw new ArgumentNullException(nameof(locationAuthService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<StockTransferDto>> Handle(ReceiveStockTransferCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InvalidId", "Transfer ID is required."));

        var transfer = await _transferRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (transfer == null)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.NotFound", "Stock transfer not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(transfer.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<StockTransferDto>.Failure(Error.Unauthorized("Transfer.Unauthorized", "Unauthorized access to requested company transfer."));

        // Status check & concurrency protection
        if (transfer.Status != StockTransferStatuses.InTransit && transfer.Status != StockTransferStatuses.Dispatched)
            return Result<StockTransferDto>.Failure(Error.Conflict("Transfer.InvalidStatus", $"Only 'InTransit' transfers can be received. Current status: '{transfer.Status}'."));

        // Authorize Destination Location Scope (Requesting Location)
        var destAuth = await _locationAuthService.AuthorizeLocationAccessAsync(
            transfer.CompanyId,
            transfer.DestinationLocationId,
            "Receive",
            cancellationToken: cancellationToken);

        if (!destAuth.IsSuccess)
            return Result<StockTransferDto>.Failure(destAuth.Error);

        // Load SalesOrder if linked
        SalesOrder? salesOrder = null;
        if (transfer.SalesOrderId.HasValue)
        {
            salesOrder = await _orderRepository.GetByIdWithDetailsAsync(transfer.SalesOrderId.Value, cancellationToken);
        }

        bool allLinesFullyReceived = true;

        foreach (var line in transfer.Lines)
        {
            decimal remainingToReceive = Math.Max(0m, line.DispatchedQuantity - line.ReceivedQuantity);
            decimal qtyToReceive = remainingToReceive;

            if (request.LineReceipts != null)
            {
                var match = request.LineReceipts.FirstOrDefault(r => r.LineId == line.Id);
                if (match != null)
                {
                    qtyToReceive = match.ReceivedQuantity;
                }
            }

            if (qtyToReceive <= 0 && remainingToReceive > 0)
            {
                allLinesFullyReceived = false;
                continue;
            }

            if (qtyToReceive > remainingToReceive)
            {
                return Result<StockTransferDto>.Failure(Error.Validation("Transfer.ExcessiveReceiveQuantity",
                    $"Cannot receive {qtyToReceive} for product {line.ProductId}. Remaining undispatched quantity is only {remainingToReceive}."));
            }

            // Destination Balance Update
            var destBal = await _balanceRepository.GetByLocationAndProductAsync(
                transfer.CompanyId,
                transfer.DestinationLocationId,
                line.ProductId,
                cancellationToken);

            if (destBal == null)
            {
                destBal = new InventoryBalance
                {
                    Id = Guid.NewGuid(),
                    CompanyId = transfer.CompanyId,
                    InventoryLocationId = transfer.DestinationLocationId,
                    ProductId = line.ProductId,
                    OnHandQuantity = qtyToReceive,
                    ReservedQuantity = 0m,
                    AllocatedQuantity = 0m,
                    CreatedAtUtc = DateTime.UtcNow
                };
                await _balanceRepository.AddAsync(destBal, cancellationToken);
            }
            else
            {
                destBal.OnHandQuantity += qtyToReceive;
                destBal.LastModifiedAtUtc = DateTime.UtcNow;
                await _balanceRepository.UpdateAsync(destBal, cancellationToken);
            }

            // Post immutable TransferIn transaction
            var txn = new InventoryTransaction
            {
                Id = Guid.NewGuid(),
                CompanyId = transfer.CompanyId,
                InventoryLocationId = transfer.DestinationLocationId,
                ProductId = line.ProductId,
                TransactionType = InventoryTransactionTypes.TransferIn,
                Quantity = qtyToReceive,
                BalanceAfter = destBal.OnHandQuantity,
                ReferenceDocumentType = "TRF",
                ReferenceDocumentId = transfer.Id,
                ReferenceDocumentNumber = transfer.TransferNumber,
                PerformedByEmployeeId = transfer.RequestedByEmployeeId,
                Notes = $"Transfer received from {transfer.SourceLocation?.Name ?? "source"}",
                CreatedAtUtc = DateTime.UtcNow
            };
            await _transactionRepository.AddAsync(txn, cancellationToken);

            line.ReceivedQuantity += qtyToReceive;
            line.LastModifiedAtUtc = DateTime.UtcNow;

            if (line.ReceivedQuantity < line.DispatchedQuantity)
            {
                allLinesFullyReceived = false;
            }

            // Auto-Reservation for linked Sales Order
            if (salesOrder != null)
            {
                var orderLine = salesOrder.Items.FirstOrDefault(i => i.ProductId == line.ProductId);
                if (orderLine != null)
                {
                    var existingReservations = await _reservationRepository.ListAsync(
                        salesOrder.CompanyId,
                        salesOrderId: salesOrder.Id,
                        productId: line.ProductId,
                        status: InventoryReservationStatuses.Active,
                        cancellationToken: cancellationToken);

                    decimal currentReserved = existingReservations.Sum(r => r.ReservedQuantity);
                    decimal outstandingNeeded = Math.Max(0m, orderLine.Quantity - currentReserved);

                    if (outstandingNeeded > 0)
                    {
                        decimal reserveQty = Math.Min(qtyToReceive, outstandingNeeded);
                        destBal.ReservedQuantity += reserveQty;
                        destBal.LastModifiedAtUtc = DateTime.UtcNow;
                        await _balanceRepository.UpdateAsync(destBal, cancellationToken);

                        var resv = new InventoryReservation
                        {
                            Id = Guid.NewGuid(),
                            CompanyId = salesOrder.CompanyId,
                            InventoryLocationId = transfer.DestinationLocationId,
                            ProductId = line.ProductId,
                            SalesOrderId = salesOrder.Id,
                            SalesOrderLineId = orderLine.Id,
                            ReservedQuantity = reserveQty,
                            Status = InventoryReservationStatuses.Active,
                            ReservedAtUtc = DateTime.UtcNow,
                            CreatedAtUtc = DateTime.UtcNow
                        };
                        await _reservationRepository.AddAsync(resv, cancellationToken);
                    }
                }
            }
        }

        // Advance Transfer Status
        if (allLinesFullyReceived)
        {
            transfer.Status = StockTransferStatuses.Completed;
            transfer.ReceivedAtUtc = DateTime.UtcNow;
        }
        else
        {
            transfer.Status = StockTransferStatuses.InTransit; // Remains InTransit for partial receive
        }
        transfer.LastModifiedAtUtc = DateTime.UtcNow;
        await _transferRepository.UpdateAsync(transfer, cancellationToken);

        // Commit transfer receipts and new reservations before evaluating order completeness
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Advance Sales Order Status if applicable
        if (salesOrder != null)
        {
            bool orderFullyReserved = true;
            foreach (var item in salesOrder.Items)
            {
                var allResvs = await _reservationRepository.ListAsync(
                    salesOrder.CompanyId,
                    salesOrderId: salesOrder.Id,
                    productId: item.ProductId,
                    status: InventoryReservationStatuses.Active,
                    cancellationToken: cancellationToken);

                if (allResvs.Sum(r => r.ReservedQuantity) < item.Quantity)
                {
                    orderFullyReserved = false;
                    break;
                }
            }

            if (orderFullyReserved)
            {
                salesOrder.OrderStatus = SalesOrderStatuses.ReadyForFulfillment;
                salesOrder.LastModifiedAtUtc = DateTime.UtcNow;
                await _orderRepository.UpdateAsync(salesOrder, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        var updated = await _transferRepository.GetByIdWithDetailsAsync(transfer.Id, cancellationToken);
        return Result.Success(MapToDto(updated!));
    }

    private static StockTransferDto MapToDto(StockTransfer t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.TransferNumber,
        t.SourceLocationId,
        t.SourceLocation?.Name ?? "Source",
        t.SourceLocation?.Code ?? "SRC",
        t.DestinationLocationId,
        t.DestinationLocation?.Name ?? "Dest",
        t.DestinationLocation?.Code ?? "DST",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber,
        t.Status,
        t.RequestedByEmployeeId,
        t.RequestedByEmployee != null ? $"{t.RequestedByEmployee.FirstName} {t.RequestedByEmployee.LastName}".Trim() : "Employee",
        t.ApprovedByEmployeeId,
        t.ApprovedByEmployee != null ? $"{t.ApprovedByEmployee.FirstName} {t.ApprovedByEmployee.LastName}".Trim() : null,
        t.DispatchedAtUtc,
        t.ReceivedAtUtc,
        t.Notes,
        t.CreatedAtUtc,
        t.LastModifiedAtUtc,
        t.Lines.Select(l => new StockTransferLineDto(
            l.Id,
            l.StockTransferId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.ApprovedQuantity,
            l.DispatchedQuantity,
            l.ReceivedQuantity,
            Math.Max(0m, l.DispatchedQuantity - l.ReceivedQuantity),
            l.CreatedAtUtc
        )).ToList()
    );
}

// ----------------------------------------------------
// 5. CANCEL STOCK TRANSFER COMMAND
// ----------------------------------------------------
public record CancelStockTransferCommand(Guid Id, Guid? CompanyId = null) : IRequest<Result<StockTransferDto>>;

public class CancelStockTransferCommandHandler : IRequestHandler<CancelStockTransferCommand, Result<StockTransferDto>>
{
    private readonly IStockTransferRepository _transferRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ILocationAuthorizationService _locationAuthService;
    private readonly IUnitOfWork _unitOfWork;

    public CancelStockTransferCommandHandler(
        IStockTransferRepository transferRepository,
        ICompanyAccessResolver companyAccessResolver,
        ILocationAuthorizationService locationAuthService,
        IUnitOfWork unitOfWork)
    {
        _transferRepository = transferRepository ?? throw new ArgumentNullException(nameof(transferRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _locationAuthService = locationAuthService ?? throw new ArgumentNullException(nameof(locationAuthService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<StockTransferDto>> Handle(CancelStockTransferCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InvalidId", "Transfer ID is required."));

        var transfer = await _transferRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (transfer == null)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.NotFound", "Stock transfer not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(transfer.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<StockTransferDto>.Failure(Error.Unauthorized("Transfer.Unauthorized", "Unauthorized access to requested company transfer."));

        // Authorize Destination or Source Location Scope
        var destAuth = await _locationAuthService.AuthorizeLocationAccessAsync(transfer.CompanyId, transfer.DestinationLocationId, "Cancel", cancellationToken: cancellationToken);
        var srcAuth = await _locationAuthService.AuthorizeLocationAccessAsync(transfer.CompanyId, transfer.SourceLocationId, "Cancel", cancellationToken: cancellationToken);

        if (!destAuth.IsSuccess && !srcAuth.IsSuccess)
            return Result<StockTransferDto>.Failure(destAuth.Error);

        if (StockTransferStatuses.InFlightStatuses.Contains(transfer.Status))
        {
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InFlightCancellationRejected",
                $"Transfers in state '{transfer.Status}' have already moved physical inventory and cannot be cancelled directly. Complete the receiving workflow."));
        }

        if (transfer.Status == StockTransferStatuses.Cancelled)
            return Result<StockTransferDto>.Failure(Error.Conflict("Transfer.AlreadyCancelled", "Transfer is already cancelled."));

        transfer.Status = StockTransferStatuses.Cancelled;
        transfer.LastModifiedAtUtc = DateTime.UtcNow;

        await _transferRepository.UpdateAsync(transfer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _transferRepository.GetByIdWithDetailsAsync(transfer.Id, cancellationToken);
        return Result.Success(new StockTransferDto(
            updated!.Id,
            updated.CompanyId,
            updated.Company?.LegalName ?? "Company",
            updated.TransferNumber,
            updated.SourceLocationId,
            updated.SourceLocation?.Name ?? "Source",
            updated.SourceLocation?.Code ?? "SRC",
            updated.DestinationLocationId,
            updated.DestinationLocation?.Name ?? "Dest",
            updated.DestinationLocation?.Code ?? "DST",
            updated.SalesOrderId,
            updated.SalesOrder?.OrderNumber,
            updated.Status,
            updated.RequestedByEmployeeId,
            updated.RequestedByEmployee != null ? $"{updated.RequestedByEmployee.FirstName} {updated.RequestedByEmployee.LastName}".Trim() : "Employee",
            updated.ApprovedByEmployeeId,
            updated.ApprovedByEmployee != null ? $"{updated.ApprovedByEmployee.FirstName} {updated.ApprovedByEmployee.LastName}".Trim() : null,
            updated.DispatchedAtUtc,
            updated.ReceivedAtUtc,
            updated.Notes,
            updated.CreatedAtUtc,
            updated.LastModifiedAtUtc,
            updated.Lines.Select(l => new StockTransferLineDto(
                l.Id,
                l.StockTransferId,
                l.ProductId,
                l.Product?.Name ?? "Product",
                l.Product?.Code ?? "PRD",
                l.Product?.Sku,
                l.Product?.BaseUom?.Name ?? "unit",
                l.RequestedQuantity,
                l.ApprovedQuantity,
                l.DispatchedQuantity,
                l.ReceivedQuantity,
                Math.Max(0m, l.DispatchedQuantity - l.ReceivedQuantity),
                l.CreatedAtUtc
            )).ToList()
        ));
    }
}

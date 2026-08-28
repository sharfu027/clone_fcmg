using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Fulfillment.DTOs;
using INK.ERP.Application.Features.Inventory.Transactions.Commands;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Features.Inventory.Fulfillment.Commands;

// ----------------------------------------------------
// 1. CREATE DISPATCH COMMAND
// ----------------------------------------------------
public record CreateDispatchCommand(
    Guid SalesOrderId,
    Guid? PackTaskId = null,
    string? VehicleNumber = null,
    string? DriverName = null,
    string? DriverPhone = null,
    string? TransporterName = null,
    string? WaybillNumber = null,
    string? Notes = null
) : IRequest<Result<DispatchDto>>;

public class CreateDispatchCommandHandler : IRequestHandler<CreateDispatchCommand, Result<DispatchDto>>
{
    private readonly IDispatchRepository _dispatchRepository;
    private readonly IPackTaskRepository _packTaskRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public CreateDispatchCommandHandler(
        IDispatchRepository dispatchRepository,
        IPackTaskRepository packTaskRepository,
        ISalesOrderRepository salesOrderRepository,
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _dispatchRepository = dispatchRepository ?? throw new ArgumentNullException(nameof(dispatchRepository));
        _packTaskRepository = packTaskRepository ?? throw new ArgumentNullException(nameof(packTaskRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<DispatchDto>> Handle(CreateDispatchCommand request, CancellationToken cancellationToken)
    {
        if (request.SalesOrderId == Guid.Empty)
            return Result<DispatchDto>.Failure(Error.Validation("Dispatch.InvalidOrderId", "Sales order ID is required."));

        var order = await _salesOrderRepository.GetByIdWithDetailsAsync(request.SalesOrderId, cancellationToken);
        if (order == null)
            return Result<DispatchDto>.Failure(Error.NotFound("Dispatch.OrderNotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<DispatchDto>.Failure(Error.Unauthorized("Dispatch.Unauthorized", "Unauthorized access to company order."));

        // Validate PackTask if supplied or find the latest packed task
        PackTask? packTask = null;
        if (request.PackTaskId.HasValue && request.PackTaskId.Value != Guid.Empty)
        {
            packTask = await _packTaskRepository.GetByIdWithDetailsAsync(request.PackTaskId.Value, cancellationToken);
            if (packTask == null || packTask.CompanyId != order.CompanyId)
                return Result<DispatchDto>.Failure(Error.NotFound("Dispatch.PackTaskNotFound", "Pack task not found or belongs to another company."));
        }
        else
        {
            packTask = await _packTaskRepository.GetByOrderAsync(order.CompanyId, order.Id, cancellationToken);
        }

        if (packTask == null || packTask.Status != PackTaskStatuses.Packed)
        {
            return Result<DispatchDto>.Failure(Error.Validation(
                "Dispatch.OrderNotPacked",
                $"Cannot create dispatch because there is no 'Packed' pack task for Sales Order '{order.OrderNumber}'."));
        }

        // Prevent duplicate active dispatch for the same order
        var existingActive = await _dispatchRepository.GetByOrderAsync(order.CompanyId, order.Id, cancellationToken);
        if (existingActive != null && existingActive.DispatchStatus != DispatchStatuses.Cancelled)
        {
            return Result<DispatchDto>.Failure(Error.Conflict(
                "Dispatch.DuplicateActiveDispatch",
                $"An active dispatch ({existingActive.DispatchNumber}) already exists for Sales Order '{order.OrderNumber}' in status '{existingActive.DispatchStatus}'."));
        }

        string dispatchNum = await _dispatchRepository.GetNextDispatchNumberAsync(order.CompanyId, cancellationToken);

        var dispatch = new Dispatch
        {
            Id = Guid.NewGuid(),
            CompanyId = order.CompanyId,
            SalesOrderId = order.Id,
            PackTaskId = packTask.Id,
            DispatchNumber = dispatchNum,
            DispatchStatus = DispatchStatuses.ReadyForDispatch,
            VehicleNumber = request.VehicleNumber,
            DriverName = request.DriverName,
            DriverPhone = request.DriverPhone,
            TransporterName = request.TransporterName,
            WaybillNumber = request.WaybillNumber,
            Notes = request.Notes,
            CreatedAtUtc = DateTime.UtcNow
        };

        // Populate dispatch lines from packages items
        var packedItems = packTask.Packages
            .SelectMany(p => p.Items)
            .GroupBy(i => new { i.ProductId, i.BatchNumber })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                BatchNumber = g.Key.BatchNumber,
                TotalQty = g.Sum(x => x.PackedQuantity)
            })
            .ToList();

        foreach (var item in packedItems)
        {
            dispatch.Lines.Add(new DispatchLine
            {
                Id = Guid.NewGuid(),
                DispatchId = dispatch.Id,
                ProductId = item.ProductId,
                DispatchedQuantity = item.TotalQty,
                BatchNumber = item.BatchNumber,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await _dispatchRepository.AddAsync(dispatch, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detail = await _dispatchRepository.GetByIdWithDetailsAsync(dispatch.Id, cancellationToken);
        return Result.Success(MapDispatchDetail(detail!));
    }

    private static DispatchDto MapDispatchDetail(Dispatch d) => new(
        d.Id,
        d.CompanyId,
        d.Company?.LegalName ?? "Company",
        d.SalesOrderId,
        d.SalesOrder?.OrderNumber ?? "SO",
        d.SalesOrder?.CustomerId ?? Guid.Empty,
        d.SalesOrder?.Customer?.LegalName ?? "Customer",
        d.PackTaskId,
        d.PackTask?.PackTaskNumber,
        d.DispatchNumber,
        d.DispatchStatus,
        d.VehicleNumber,
        d.DriverName,
        d.DriverPhone,
        d.TransporterName,
        d.WaybillNumber,
        d.DispatchedAtUtc,
        d.DispatchedByEmployeeId,
        d.DispatchedByEmployee != null ? $"{d.DispatchedByEmployee.FirstName} {d.DispatchedByEmployee.LastName}".Trim() : null,
        d.Notes,
        d.ConcurrencyToken,
        d.CreatedAtUtc,
        d.Lines.Select(l => new DispatchLineDto(
            l.Id,
            l.DispatchId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.DispatchedQuantity,
            l.BatchNumber
        )).ToList()
    );
}

// ----------------------------------------------------
// 2. CONFIRM DISPATCH COMMAND (Goods Issue & Reservation Fulfillment)
// ----------------------------------------------------
public record ConfirmDispatchCommand(
    Guid DispatchId,
    Guid? DispatchedByEmployeeId = null,
    string? Notes = null
) : IRequest<Result<DispatchDto>>;

public class ConfirmDispatchCommandHandler : IRequestHandler<ConfirmDispatchCommand, Result<DispatchDto>>
{
    private readonly IDispatchRepository _dispatchRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ISender _mediator;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmDispatchCommandHandler(
        IDispatchRepository dispatchRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryReservationRepository reservationRepository,
        ISalesOrderRepository salesOrderRepository,
        IEmployeeRepository employeeRepository,
        ISender mediator,
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _dispatchRepository = dispatchRepository ?? throw new ArgumentNullException(nameof(dispatchRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<DispatchDto>> Handle(ConfirmDispatchCommand request, CancellationToken cancellationToken)
    {
        if (request.DispatchId == Guid.Empty)
            return Result<DispatchDto>.Failure(Error.Validation("Dispatch.InvalidId", "Dispatch ID is required."));

        var dispatch = await _dispatchRepository.GetByIdWithDetailsAsync(request.DispatchId, cancellationToken);
        if (dispatch == null)
            return Result<DispatchDto>.Failure(Error.NotFound("Dispatch.NotFound", "Dispatch not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(dispatch.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<DispatchDto>.Failure(Error.Unauthorized("Dispatch.Unauthorized", "Unauthorized access to company dispatch."));

        if (dispatch.DispatchStatus != DispatchStatuses.ReadyForDispatch && dispatch.DispatchStatus != DispatchStatuses.Draft)
        {
            return Result<DispatchDto>.Failure(Error.Validation(
                "Dispatch.InvalidStatusForConfirm",
                $"Cannot confirm dispatch in status '{dispatch.DispatchStatus}'. Status must be 'ReadyForDispatch'."));
        }

        var order = await _salesOrderRepository.GetByIdWithDetailsAsync(dispatch.SalesOrderId, cancellationToken);
        if (order == null)
            return Result<DispatchDto>.Failure(Error.NotFound("Dispatch.OrderNotFound", "Associated sales order not found."));

        if (!order.InventoryLocationId.HasValue || order.InventoryLocationId.Value == Guid.Empty)
            return Result<DispatchDto>.Failure(Error.Validation("Dispatch.NoLocation", "Sales order location is invalid."));

        Guid locationId = order.InventoryLocationId.Value;

        // Validate employee if supplied
        if (request.DispatchedByEmployeeId.HasValue && request.DispatchedByEmployeeId.Value != Guid.Empty)
        {
            var emp = await _employeeRepository.GetByIdAsync(request.DispatchedByEmployeeId.Value, cancellationToken);
            if (emp == null || emp.CompanyId != dispatch.CompanyId || !emp.IsActive)
                return Result<DispatchDto>.Failure(Error.Validation("Dispatch.InvalidEmployee", "Dispatched-by employee is invalid or belongs to another company."));

            dispatch.DispatchedByEmployeeId = emp.Id;
        }

        // Fetch active/allocated reservations for this sales order
        var allReservations = await _reservationRepository.ListAsync(
            companyId: dispatch.CompanyId,
            salesOrderId: order.Id,
            pageSize: 200,
            cancellationToken: cancellationToken);

        var reservations = allReservations
            .Where(r => r.Status == InventoryReservationStatuses.Allocated || r.Status == InventoryReservationStatuses.Active)
            .ToList();

        // 1. Post GoodsIssue transaction for each dispatch line
        foreach (var line in dispatch.Lines)
        {
            var postTxResult = await _mediator.Send(new PostInventoryTransactionCommand(
                CompanyId: dispatch.CompanyId,
                InventoryLocationId: locationId,
                ProductId: line.ProductId,
                TransactionType: InventoryTransactionTypes.GoodsIssue,
                Quantity: line.DispatchedQuantity,
                ReferenceDocumentType: "SalesOrder",
                ReferenceDocumentId: order.Id,
                ReferenceDocumentNumber: order.OrderNumber,
                BatchNumber: line.BatchNumber,
                PerformedByEmployeeId: dispatch.DispatchedByEmployeeId,
                Notes: $"Order dispatch: {dispatch.DispatchNumber}"
            ), cancellationToken);

            if (postTxResult.IsFailure)
            {
                return Result<DispatchDto>.Failure(postTxResult.Error);
            }

            // 2. Clear AllocatedQuantity on InventoryBalance
            var balance = await _balanceRepository.GetByLocationAndProductAsync(
                dispatch.CompanyId,
                locationId,
                line.ProductId,
                cancellationToken);

            if (balance != null)
            {
                decimal qtyToDeduct = Math.Min(balance.AllocatedQuantity, line.DispatchedQuantity);
                balance.AllocatedQuantity = Math.Max(0m, balance.AllocatedQuantity - qtyToDeduct);
                balance.LastModifiedAtUtc = DateTime.UtcNow;
                await _balanceRepository.UpdateAsync(balance, cancellationToken);
            }

            // 3. Mark matching reservations as Fulfilled
            var matchedResvs = reservations
                .Where(r => r.ProductId == line.ProductId && 
                           (r.Status == InventoryReservationStatuses.Allocated || r.Status == InventoryReservationStatuses.Active))
                .ToList();

            decimal remainingToFulfill = line.DispatchedQuantity;
            foreach (var resv in matchedResvs)
            {
                if (remainingToFulfill <= 0) break;

                decimal fulfillAmount = Math.Min(resv.ReservedQuantity, remainingToFulfill);
                resv.Status = InventoryReservationStatuses.Fulfilled;
                resv.ReleasedAtUtc = DateTime.UtcNow;
                resv.LastModifiedAtUtc = DateTime.UtcNow;
                await _reservationRepository.UpdateAsync(resv, cancellationToken);

                remainingToFulfill -= fulfillAmount;
            }
        }

        // 4. Update Dispatch Status
        dispatch.DispatchStatus = DispatchStatuses.Dispatched;
        dispatch.DispatchedAtUtc = DateTime.UtcNow;
        dispatch.Notes = string.IsNullOrWhiteSpace(request.Notes) ? dispatch.Notes : request.Notes;
        dispatch.LastModifiedAtUtc = DateTime.UtcNow;
        await _dispatchRepository.UpdateAsync(dispatch, cancellationToken);

        // 5. Update SalesOrder Status
        order.OrderStatus = SalesOrderStatuses.Dispatched;
        order.LastModifiedAtUtc = DateTime.UtcNow;
        await _salesOrderRepository.UpdateAsync(order, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _dispatchRepository.GetByIdWithDetailsAsync(dispatch.Id, cancellationToken);
        return Result.Success(MapDispatchDetail(updated!));
    }

    private static DispatchDto MapDispatchDetail(Dispatch d) => new(
        d.Id,
        d.CompanyId,
        d.Company?.LegalName ?? "Company",
        d.SalesOrderId,
        d.SalesOrder?.OrderNumber ?? "SO",
        d.SalesOrder?.CustomerId ?? Guid.Empty,
        d.SalesOrder?.Customer?.LegalName ?? "Customer",
        d.PackTaskId,
        d.PackTask?.PackTaskNumber,
        d.DispatchNumber,
        d.DispatchStatus,
        d.VehicleNumber,
        d.DriverName,
        d.DriverPhone,
        d.TransporterName,
        d.WaybillNumber,
        d.DispatchedAtUtc,
        d.DispatchedByEmployeeId,
        d.DispatchedByEmployee != null ? $"{d.DispatchedByEmployee.FirstName} {d.DispatchedByEmployee.LastName}".Trim() : null,
        d.Notes,
        d.ConcurrencyToken,
        d.CreatedAtUtc,
        d.Lines.Select(l => new DispatchLineDto(
            l.Id,
            l.DispatchId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.DispatchedQuantity,
            l.BatchNumber
        )).ToList()
    );
}

// ----------------------------------------------------
// 3. CANCEL DISPATCH COMMAND
// ----------------------------------------------------
public record CancelDispatchCommand(Guid DispatchId) : IRequest<Result<DispatchDto>>;

public class CancelDispatchCommandHandler : IRequestHandler<CancelDispatchCommand, Result<DispatchDto>>
{
    private readonly IDispatchRepository _dispatchRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CancelDispatchCommandHandler(
        IDispatchRepository dispatchRepository,
        ISalesOrderRepository salesOrderRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _dispatchRepository = dispatchRepository ?? throw new ArgumentNullException(nameof(dispatchRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<DispatchDto>> Handle(CancelDispatchCommand request, CancellationToken cancellationToken)
    {
        if (request.DispatchId == Guid.Empty)
            return Result<DispatchDto>.Failure(Error.Validation("Dispatch.InvalidId", "Dispatch ID is required."));

        var dispatch = await _dispatchRepository.GetByIdWithDetailsAsync(request.DispatchId, cancellationToken);
        if (dispatch == null)
            return Result<DispatchDto>.Failure(Error.NotFound("Dispatch.NotFound", "Dispatch not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(dispatch.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<DispatchDto>.Failure(Error.Unauthorized("Dispatch.Unauthorized", "Unauthorized access to company dispatch."));

        if (dispatch.DispatchStatus == DispatchStatuses.Dispatched)
        {
            return Result<DispatchDto>.Failure(Error.Validation("Dispatch.AlreadyDispatched", "Cannot cancel a shipment that has already been dispatched."));
        }

        dispatch.DispatchStatus = DispatchStatuses.Cancelled;
        dispatch.LastModifiedAtUtc = DateTime.UtcNow;
        await _dispatchRepository.UpdateAsync(dispatch, cancellationToken);

        if (dispatch.SalesOrder != null)
        {
            dispatch.SalesOrder.OrderStatus = SalesOrderStatuses.Packed;
            dispatch.SalesOrder.LastModifiedAtUtc = DateTime.UtcNow;
            await _salesOrderRepository.UpdateAsync(dispatch.SalesOrder, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _dispatchRepository.GetByIdWithDetailsAsync(dispatch.Id, cancellationToken);
        return Result.Success(MapDispatchDetail(updated!));
    }

    private static DispatchDto MapDispatchDetail(Dispatch d) => new(
        d.Id,
        d.CompanyId,
        d.Company?.LegalName ?? "Company",
        d.SalesOrderId,
        d.SalesOrder?.OrderNumber ?? "SO",
        d.SalesOrder?.CustomerId ?? Guid.Empty,
        d.SalesOrder?.Customer?.LegalName ?? "Customer",
        d.PackTaskId,
        d.PackTask?.PackTaskNumber,
        d.DispatchNumber,
        d.DispatchStatus,
        d.VehicleNumber,
        d.DriverName,
        d.DriverPhone,
        d.TransporterName,
        d.WaybillNumber,
        d.DispatchedAtUtc,
        d.DispatchedByEmployeeId,
        d.DispatchedByEmployee != null ? $"{d.DispatchedByEmployee.FirstName} {d.DispatchedByEmployee.LastName}".Trim() : null,
        d.Notes,
        d.ConcurrencyToken,
        d.CreatedAtUtc,
        d.Lines.Select(l => new DispatchLineDto(
            l.Id,
            l.DispatchId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.DispatchedQuantity,
            l.BatchNumber
        )).ToList()
    );
}

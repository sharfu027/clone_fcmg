using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Fulfillment.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Features.Inventory.Fulfillment.Commands;

// ----------------------------------------------------
// 1. CREATE PICK TASK COMMAND
// ----------------------------------------------------
public record CreatePickTaskCommand(
    Guid SalesOrderId,
    Guid? AssignedEmployeeId = null,
    string? Notes = null
) : IRequest<Result<PickTaskDto>>;

public class CreatePickTaskCommandHandler : IRequestHandler<CreatePickTaskCommand, Result<PickTaskDto>>
{
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public CreatePickTaskCommandHandler(
        IPickTaskRepository pickTaskRepository,
        ISalesOrderRepository salesOrderRepository,
        IInventoryReservationRepository reservationRepository,
        IEmployeeRepository employeeRepository,
        IInventoryLocationRepository locationRepository,
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _locationRepository = locationRepository ?? throw new ArgumentNullException(nameof(locationRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PickTaskDto>> Handle(CreatePickTaskCommand request, CancellationToken cancellationToken)
    {
        if (request.SalesOrderId == Guid.Empty)
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidOrderId", "Sales order ID is required."));

        var order = await _salesOrderRepository.GetByIdWithDetailsAsync(request.SalesOrderId, cancellationToken);
        if (order == null)
            return Result<PickTaskDto>.Failure(Error.NotFound("PickTask.OrderNotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PickTaskDto>.Failure(Error.Unauthorized("PickTask.Unauthorized", "Unauthorized access to company order."));

        // Must be in ReadyForFulfillment or Reserved
        if (order.OrderStatus != SalesOrderStatuses.ReadyForFulfillment &&
            order.OrderStatus != SalesOrderStatuses.Reserved &&
            order.OrderStatus != SalesOrderStatuses.Picking)
        {
            return Result<PickTaskDto>.Failure(Error.Validation(
                "PickTask.InvalidOrderStatus",
                $"Cannot create pick task for order in status '{order.OrderStatus}'. Order must be 'ReadyForFulfillment' or 'Reserved'."));
        }

        if (!order.InventoryLocationId.HasValue || order.InventoryLocationId.Value == Guid.Empty)
        {
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.NoLocation", "Sales order does not have an assigned fulfillment InventoryLocation."));
        }

        var location = await _locationRepository.GetByIdAsync(order.InventoryLocationId.Value, cancellationToken);
        if (location == null || location.CompanyId != order.CompanyId || !location.IsActive)
        {
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InactiveLocation", "Fulfillment location is inactive or invalid."));
        }

        // Prevent duplicate active pick task for the same order
        var existingList = await _pickTaskRepository.ListAsync(order.CompanyId, salesOrderId: order.Id, cancellationToken: cancellationToken);
        var existingActive = existingList.FirstOrDefault(x => x.Status != PickTaskStatuses.Cancelled && x.Status != PickTaskStatuses.Completed);
        if (existingActive != null)
        {
            return Result<PickTaskDto>.Failure(Error.Conflict(
                "PickTask.DuplicateActiveTask",
                $"An active pick task ({existingActive.PickTaskNumber}) already exists for Sales Order '{order.OrderNumber}' in status '{existingActive.Status}'."));
        }

        // Validate assigned employee if provided
        Employee? employee = null;
        if (request.AssignedEmployeeId.HasValue && request.AssignedEmployeeId.Value != Guid.Empty)
        {
            employee = await _employeeRepository.GetByIdAsync(request.AssignedEmployeeId.Value, cancellationToken);
            if (employee == null || employee.CompanyId != order.CompanyId || !employee.IsActive)
            {
                return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidPicker", "Assigned employee does not exist, is inactive, or belongs to another company."));
            }

            // Check branch/warehouse scope compatibility
            if (employee.BranchId.HasValue && location.BranchId.HasValue && employee.BranchId.Value != location.BranchId.Value)
            {
                return Result<PickTaskDto>.Failure(Error.Validation("PickTask.ScopeMismatchBranch", "Employee branch scope does not match location branch."));
            }
            if (employee.WarehouseId.HasValue && location.WarehouseId.HasValue && employee.WarehouseId.Value != location.WarehouseId.Value)
            {
                return Result<PickTaskDto>.Failure(Error.Validation("PickTask.ScopeMismatchWarehouse", "Employee warehouse scope does not match location warehouse."));
            }
        }

        // Fetch active reservations for this sales order
        var reservations = await _reservationRepository.ListAsync(
            companyId: order.CompanyId,
            salesOrderId: order.Id,
            pageSize: 200,
            cancellationToken: cancellationToken);

        var activeResvs = reservations
            .Where(r => r.Status == InventoryReservationStatuses.Active || r.Status == InventoryReservationStatuses.Allocated)
            .ToList();

        if (activeResvs.Count == 0)
        {
            return Result<PickTaskDto>.Failure(Error.Validation(
                "PickTask.NoReservationsFound",
                "No active stock reservations found for this sales order. Please verify stock availability before picking."));
        }

        string pickNumber = await _pickTaskRepository.GetNextPickTaskNumberAsync(order.CompanyId, cancellationToken);

        var pickTask = new PickTask
        {
            Id = Guid.NewGuid(),
            CompanyId = order.CompanyId,
            SalesOrderId = order.Id,
            InventoryLocationId = location.Id,
            PickTaskNumber = pickNumber,
            AssignedEmployeeId = request.AssignedEmployeeId,
            Status = request.AssignedEmployeeId.HasValue ? PickTaskStatuses.Assigned : PickTaskStatuses.Pending,
            Notes = request.Notes,
            CreatedAtUtc = DateTime.UtcNow
        };

        foreach (var item in order.Items)
        {
            decimal itemReserved = activeResvs
                .Where(r => r.SalesOrderLineId == item.Id || (r.SalesOrderLineId == null && r.ProductId == item.ProductId))
                .Sum(r => r.ReservedQuantity);

            pickTask.Lines.Add(new PickTaskLine
            {
                Id = Guid.NewGuid(),
                PickTaskId = pickTask.Id,
                SalesOrderLineId = item.Id,
                ProductId = item.ProductId,
                RequestedQuantity = item.Quantity,
                AllocatedQuantity = itemReserved,
                PickedQuantity = 0m,
                ShortQuantity = 0m,
                Status = PickTaskLineStatuses.Pending,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await _pickTaskRepository.AddAsync(pickTask, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detail = await _pickTaskRepository.GetByIdWithDetailsAsync(pickTask.Id, cancellationToken);
        return Result.Success(MapPickTaskDetail(detail!));
    }

    private static PickTaskDto MapPickTaskDetail(PickTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.InventoryLocationId,
        t.InventoryLocation?.Name ?? "Location",
        t.InventoryLocation?.Code ?? "LOC",
        t.PickTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Lines.Select(l => new PickTaskLineDto(
            l.Id,
            l.PickTaskId,
            l.SalesOrderLineId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.AllocatedQuantity,
            l.PickedQuantity,
            l.ShortQuantity,
            l.Status,
            l.BatchNumber,
            l.ExpiryDate
        )).ToList()
    );
}

// ----------------------------------------------------
// 2. ASSIGN PICKER COMMAND
// ----------------------------------------------------
public record AssignPickerCommand(
    Guid PickTaskId,
    Guid EmployeeId
) : IRequest<Result<PickTaskDto>>;

public class AssignPickerCommandHandler : IRequestHandler<AssignPickerCommand, Result<PickTaskDto>>
{
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public AssignPickerCommandHandler(
        IPickTaskRepository pickTaskRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PickTaskDto>> Handle(AssignPickerCommand request, CancellationToken cancellationToken)
    {
        if (request.PickTaskId == Guid.Empty || request.EmployeeId == Guid.Empty)
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidParams", "Pick Task ID and Employee ID are required."));

        var pickTask = await _pickTaskRepository.GetByIdWithDetailsAsync(request.PickTaskId, cancellationToken);
        if (pickTask == null)
            return Result<PickTaskDto>.Failure(Error.NotFound("PickTask.NotFound", "Pick task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(pickTask.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PickTaskDto>.Failure(Error.Unauthorized("PickTask.Unauthorized", "Unauthorized access to company pick task."));

        if (pickTask.Status == PickTaskStatuses.Completed || pickTask.Status == PickTaskStatuses.Cancelled)
        {
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidStatusForAssignment", $"Cannot assign picker to a {pickTask.Status} pick task."));
        }

        var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId, cancellationToken);
        if (employee == null || employee.CompanyId != pickTask.CompanyId || !employee.IsActive)
        {
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidEmployee", "Selected employee does not exist, is inactive, or belongs to another company."));
        }

        // Scope validation
        if (pickTask.InventoryLocation != null)
        {
            if (employee.BranchId.HasValue && pickTask.InventoryLocation.BranchId.HasValue && employee.BranchId.Value != pickTask.InventoryLocation.BranchId.Value)
            {
                return Result<PickTaskDto>.Failure(Error.Validation("PickTask.ScopeMismatchBranch", "Employee branch scope does not match location branch."));
            }
            if (employee.WarehouseId.HasValue && pickTask.InventoryLocation.WarehouseId.HasValue && employee.WarehouseId.Value != pickTask.InventoryLocation.WarehouseId.Value)
            {
                return Result<PickTaskDto>.Failure(Error.Validation("PickTask.ScopeMismatchWarehouse", "Employee warehouse scope does not match location warehouse."));
            }
        }

        pickTask.AssignedEmployeeId = employee.Id;
        if (pickTask.Status == PickTaskStatuses.Pending)
        {
            pickTask.Status = PickTaskStatuses.Assigned;
        }

        pickTask.LastModifiedAtUtc = DateTime.UtcNow;
        await _pickTaskRepository.UpdateAsync(pickTask, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _pickTaskRepository.GetByIdWithDetailsAsync(pickTask.Id, cancellationToken);
        return Result.Success(MapPickTaskDetail(updated!));
    }

    private static PickTaskDto MapPickTaskDetail(PickTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.InventoryLocationId,
        t.InventoryLocation?.Name ?? "Location",
        t.InventoryLocation?.Code ?? "LOC",
        t.PickTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Lines.Select(l => new PickTaskLineDto(
            l.Id,
            l.PickTaskId,
            l.SalesOrderLineId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.AllocatedQuantity,
            l.PickedQuantity,
            l.ShortQuantity,
            l.Status,
            l.BatchNumber,
            l.ExpiryDate
        )).ToList()
    );
}

// ----------------------------------------------------
// 3. START PICK TASK COMMAND (Reserved -> Allocated transition)
// ----------------------------------------------------
public record StartPickTaskCommand(Guid PickTaskId) : IRequest<Result<PickTaskDto>>;

public class StartPickTaskCommandHandler : IRequestHandler<StartPickTaskCommand, Result<PickTaskDto>>
{
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public StartPickTaskCommandHandler(
        IPickTaskRepository pickTaskRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryReservationRepository reservationRepository,
        ISalesOrderRepository salesOrderRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PickTaskDto>> Handle(StartPickTaskCommand request, CancellationToken cancellationToken)
    {
        if (request.PickTaskId == Guid.Empty)
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidId", "Pick task ID is required."));

        var pickTask = await _pickTaskRepository.GetByIdWithDetailsAsync(request.PickTaskId, cancellationToken);
        if (pickTask == null)
            return Result<PickTaskDto>.Failure(Error.NotFound("PickTask.NotFound", "Pick task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(pickTask.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PickTaskDto>.Failure(Error.Unauthorized("PickTask.Unauthorized", "Unauthorized access to company pick task."));

        if (pickTask.Status != PickTaskStatuses.Pending && pickTask.Status != PickTaskStatuses.Assigned)
        {
            return Result<PickTaskDto>.Failure(Error.Validation(
                "PickTask.InvalidStatusForStart",
                $"Cannot start pick task in status '{pickTask.Status}'. Only Pending or Assigned tasks can be started."));
        }

        // Perform atomic transition: ReservedQuantity -> AllocatedQuantity on InventoryBalance
        // and InventoryReservation.Status -> Allocated
        var reservations = await _reservationRepository.ListAsync(
            companyId: pickTask.CompanyId,
            salesOrderId: pickTask.SalesOrderId,
            status: InventoryReservationStatuses.Active,
            pageSize: 200,
            cancellationToken: cancellationToken);

        foreach (var line in pickTask.Lines)
        {
            var balance = await _balanceRepository.GetByLocationAndProductAsync(
                pickTask.CompanyId,
                pickTask.InventoryLocationId,
                line.ProductId,
                cancellationToken);

            if (balance != null)
            {
                decimal qtyToShift = Math.Min(balance.ReservedQuantity, line.AllocatedQuantity);
                balance.ReservedQuantity = Math.Max(0m, balance.ReservedQuantity - qtyToShift);
                balance.AllocatedQuantity += qtyToShift;
                balance.LastModifiedAtUtc = DateTime.UtcNow;
                await _balanceRepository.UpdateAsync(balance, cancellationToken);
            }

            var lineResvs = reservations.Where(r => r.SalesOrderLineId == line.SalesOrderLineId || (r.SalesOrderLineId == null && r.ProductId == line.ProductId));
            foreach (var resv in lineResvs)
            {
                resv.Status = InventoryReservationStatuses.Allocated;
                resv.LastModifiedAtUtc = DateTime.UtcNow;
                await _reservationRepository.UpdateAsync(resv, cancellationToken);
            }
        }

        pickTask.Status = PickTaskStatuses.InProgress;
        pickTask.StartedAtUtc = DateTime.UtcNow;
        pickTask.LastModifiedAtUtc = DateTime.UtcNow;
        await _pickTaskRepository.UpdateAsync(pickTask, cancellationToken);

        // Update SalesOrder status to Picking
        if (pickTask.SalesOrder != null)
        {
            pickTask.SalesOrder.OrderStatus = SalesOrderStatuses.Picking;
            pickTask.SalesOrder.LastModifiedAtUtc = DateTime.UtcNow;
            await _salesOrderRepository.UpdateAsync(pickTask.SalesOrder, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _pickTaskRepository.GetByIdWithDetailsAsync(pickTask.Id, cancellationToken);
        return Result.Success(MapPickTaskDetail(updated!));
    }

    private static PickTaskDto MapPickTaskDetail(PickTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.InventoryLocationId,
        t.InventoryLocation?.Name ?? "Location",
        t.InventoryLocation?.Code ?? "LOC",
        t.PickTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Lines.Select(l => new PickTaskLineDto(
            l.Id,
            l.PickTaskId,
            l.SalesOrderLineId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.AllocatedQuantity,
            l.PickedQuantity,
            l.ShortQuantity,
            l.Status,
            l.BatchNumber,
            l.ExpiryDate
        )).ToList()
    );
}

// ----------------------------------------------------
// 4. COMPLETE PICK TASK COMMAND (Verification & Short-pick calculation)
// ----------------------------------------------------
public record CompletePickTaskItemRequest(
    Guid PickTaskLineId,
    decimal PickedQuantity,
    string? BatchNumber = null,
    DateTime? ExpiryDate = null,
    string? ScannedCode = null
);

public record CompletePickTaskCommand(
    Guid PickTaskId,
    List<CompletePickTaskItemRequest> LineVerifications
) : IRequest<Result<PickTaskDto>>;

public class CompletePickTaskCommandHandler : IRequestHandler<CompletePickTaskCommand, Result<PickTaskDto>>
{
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly IProductRepository _productRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CompletePickTaskCommandHandler(
        IPickTaskRepository pickTaskRepository,
        IProductRepository productRepository,
        ISalesOrderRepository salesOrderRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PickTaskDto>> Handle(CompletePickTaskCommand request, CancellationToken cancellationToken)
    {
        if (request.PickTaskId == Guid.Empty)
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidId", "Pick task ID is required."));

        var pickTask = await _pickTaskRepository.GetByIdWithDetailsAsync(request.PickTaskId, cancellationToken);
        if (pickTask == null)
            return Result<PickTaskDto>.Failure(Error.NotFound("PickTask.NotFound", "Pick task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(pickTask.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PickTaskDto>.Failure(Error.Unauthorized("PickTask.Unauthorized", "Unauthorized access to company pick task."));

        if (pickTask.Status != PickTaskStatuses.InProgress && pickTask.Status != PickTaskStatuses.Assigned)
        {
            return Result<PickTaskDto>.Failure(Error.Validation(
                "PickTask.InvalidStatusForCompletion",
                $"Cannot complete pick task in status '{pickTask.Status}'. Task must be 'InProgress' or 'Assigned'."));
        }

        bool hasShortPick = false;

        foreach (var line in pickTask.Lines)
        {
            var ver = request.LineVerifications?.FirstOrDefault(v => v.PickTaskLineId == line.Id);
            decimal picked = ver?.PickedQuantity ?? line.AllocatedQuantity; // Default to full allocated if not specified in verification

            if (picked < 0)
                return Result<PickTaskDto>.Failure(Error.Validation("PickTask.NegativePickedQty", $"Picked quantity cannot be negative for product '{line.Product?.Name}'."));

            if (picked > line.AllocatedQuantity)
                return Result<PickTaskDto>.Failure(Error.Validation("PickTask.OverPickNotAllowed", $"Picked quantity ({picked}) cannot exceed allocated quantity ({line.AllocatedQuantity}) for product '{line.Product?.Name}'."));

            var prod = await _productRepository.GetByIdAsync(line.ProductId, cancellationToken);
            if (prod != null)
            {
                if (prod.IsBatchTracked && string.IsNullOrWhiteSpace(ver?.BatchNumber) && string.IsNullOrWhiteSpace(line.BatchNumber))
                {
                    return Result<PickTaskDto>.Failure(Error.Validation("PickTask.BatchRequired", $"Product '{prod.Name}' is batch-tracked. A Batch Number is required for pick verification."));
                }
            }

            decimal shortQty = Math.Max(0m, line.AllocatedQuantity - picked);
            line.PickedQuantity = picked;
            line.ShortQuantity = shortQty;
            line.BatchNumber = ver?.BatchNumber ?? line.BatchNumber;
            line.ExpiryDate = ver?.ExpiryDate ?? line.ExpiryDate;

            if (shortQty > 0)
            {
                line.Status = PickTaskLineStatuses.ShortPicked;
                hasShortPick = true;
            }
            else
            {
                line.Status = PickTaskLineStatuses.Picked;
            }

            line.LastModifiedAtUtc = DateTime.UtcNow;
        }

        pickTask.Status = hasShortPick ? PickTaskStatuses.PartiallyPicked : PickTaskStatuses.Completed;
        pickTask.CompletedAtUtc = DateTime.UtcNow;
        pickTask.LastModifiedAtUtc = DateTime.UtcNow;
        await _pickTaskRepository.UpdateAsync(pickTask, cancellationToken);

        // Update SalesOrder status
        if (pickTask.SalesOrder != null)
        {
            pickTask.SalesOrder.OrderStatus = SalesOrderStatuses.Picked;
            pickTask.SalesOrder.LastModifiedAtUtc = DateTime.UtcNow;
            await _salesOrderRepository.UpdateAsync(pickTask.SalesOrder, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _pickTaskRepository.GetByIdWithDetailsAsync(pickTask.Id, cancellationToken);
        return Result.Success(MapPickTaskDetail(updated!));
    }

    private static PickTaskDto MapPickTaskDetail(PickTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.InventoryLocationId,
        t.InventoryLocation?.Name ?? "Location",
        t.InventoryLocation?.Code ?? "LOC",
        t.PickTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Lines.Select(l => new PickTaskLineDto(
            l.Id,
            l.PickTaskId,
            l.SalesOrderLineId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.AllocatedQuantity,
            l.PickedQuantity,
            l.ShortQuantity,
            l.Status,
            l.BatchNumber,
            l.ExpiryDate
        )).ToList()
    );
}

// ----------------------------------------------------
// 5. CANCEL PICK TASK COMMAND (Reverts allocation to reservation)
// ----------------------------------------------------
public record CancelPickTaskCommand(Guid PickTaskId) : IRequest<Result<PickTaskDto>>;

public class CancelPickTaskCommandHandler : IRequestHandler<CancelPickTaskCommand, Result<PickTaskDto>>
{
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CancelPickTaskCommandHandler(
        IPickTaskRepository pickTaskRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryReservationRepository reservationRepository,
        ISalesOrderRepository salesOrderRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PickTaskDto>> Handle(CancelPickTaskCommand request, CancellationToken cancellationToken)
    {
        if (request.PickTaskId == Guid.Empty)
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidId", "Pick task ID is required."));

        var pickTask = await _pickTaskRepository.GetByIdWithDetailsAsync(request.PickTaskId, cancellationToken);
        if (pickTask == null)
            return Result<PickTaskDto>.Failure(Error.NotFound("PickTask.NotFound", "Pick task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(pickTask.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PickTaskDto>.Failure(Error.Unauthorized("PickTask.Unauthorized", "Unauthorized access to company pick task."));

        if (pickTask.Status == PickTaskStatuses.Completed || pickTask.Status == PickTaskStatuses.Cancelled)
        {
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.AlreadyFinished", $"Cannot cancel a pick task that is already '{pickTask.Status}'."));
        }

        // If the task was InProgress or Allocated, revert AllocatedQuantity -> ReservedQuantity
        if (pickTask.Status == PickTaskStatuses.InProgress)
        {
            var reservations = await _reservationRepository.ListAsync(
                companyId: pickTask.CompanyId,
                salesOrderId: pickTask.SalesOrderId,
                status: InventoryReservationStatuses.Allocated,
                pageSize: 200,
                cancellationToken: cancellationToken);

            foreach (var line in pickTask.Lines)
            {
                var balance = await _balanceRepository.GetByLocationAndProductAsync(
                    pickTask.CompanyId,
                    pickTask.InventoryLocationId,
                    line.ProductId,
                    cancellationToken);

                if (balance != null)
                {
                    decimal qtyToRevert = Math.Min(balance.AllocatedQuantity, line.AllocatedQuantity);
                    balance.AllocatedQuantity = Math.Max(0m, balance.AllocatedQuantity - qtyToRevert);
                    balance.ReservedQuantity += qtyToRevert;
                    balance.LastModifiedAtUtc = DateTime.UtcNow;
                    await _balanceRepository.UpdateAsync(balance, cancellationToken);
                }

                var lineResvs = reservations.Where(r => r.SalesOrderLineId == line.SalesOrderLineId || (r.SalesOrderLineId == null && r.ProductId == line.ProductId));
                foreach (var resv in lineResvs)
                {
                    resv.Status = InventoryReservationStatuses.Active;
                    resv.LastModifiedAtUtc = DateTime.UtcNow;
                    await _reservationRepository.UpdateAsync(resv, cancellationToken);
                }
            }
        }

        pickTask.Status = PickTaskStatuses.Cancelled;
        pickTask.LastModifiedAtUtc = DateTime.UtcNow;
        foreach (var line in pickTask.Lines)
        {
            line.Status = PickTaskLineStatuses.Cancelled;
            line.LastModifiedAtUtc = DateTime.UtcNow;
        }

        await _pickTaskRepository.UpdateAsync(pickTask, cancellationToken);

        // Reset SalesOrder status to ReadyForFulfillment
        if (pickTask.SalesOrder != null)
        {
            pickTask.SalesOrder.OrderStatus = SalesOrderStatuses.ReadyForFulfillment;
            pickTask.SalesOrder.LastModifiedAtUtc = DateTime.UtcNow;
            await _salesOrderRepository.UpdateAsync(pickTask.SalesOrder, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _pickTaskRepository.GetByIdWithDetailsAsync(pickTask.Id, cancellationToken);
        return Result.Success(MapPickTaskDetail(updated!));
    }

    private static PickTaskDto MapPickTaskDetail(PickTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.InventoryLocationId,
        t.InventoryLocation?.Name ?? "Location",
        t.InventoryLocation?.Code ?? "LOC",
        t.PickTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Lines.Select(l => new PickTaskLineDto(
            l.Id,
            l.PickTaskId,
            l.SalesOrderLineId,
            l.ProductId,
            l.Product?.Name ?? "Product",
            l.Product?.Code ?? "PRD",
            l.Product?.Sku,
            l.Product?.BaseUom?.Name ?? "unit",
            l.RequestedQuantity,
            l.AllocatedQuantity,
            l.PickedQuantity,
            l.ShortQuantity,
            l.Status,
            l.BatchNumber,
            l.ExpiryDate
        )).ToList()
    );
}

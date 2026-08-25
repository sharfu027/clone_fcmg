using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Sales.Orders.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Sales.Orders.Commands;

// ----------------------------------------------------
// 1. CREATE SALES ORDER COMMAND
// ----------------------------------------------------
public record CreateSalesOrderCommand(
    Guid CompanyId,
    Guid CustomerId,
    Guid? SalesEmployeeId,
    Guid? InventoryLocationId,
    DateTime? OrderDateUtc,
    string? Notes,
    List<CreateSalesOrderItemRequest> Items
) : IRequest<Result<SalesOrderDto>>;

public class CreateSalesOrderCommandHandler : IRequestHandler<CreateSalesOrderCommand, Result<SalesOrderDto>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CreateSalesOrderCommandHandler(
        ISalesOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IEmployeeRepository employeeRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _locationRepository = locationRepository ?? throw new ArgumentNullException(nameof(locationRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<SalesOrderDto>> Handle(CreateSalesOrderCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.EmptyCompany", "Company ID is required."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesOrderDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company."));

        if (request.Items == null || request.Items.Count == 0)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.EmptyItems", "Order must contain at least one line item."));

        // Validate Customer
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null || customer.CompanyId != request.CompanyId)
            return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.CustomerNotFound", "Customer not found or does not belong to specified company."));
        if (!customer.IsActive)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveCustomer", "Cannot create order for an inactive customer."));

        // Validate Sales Employee if specified
        if (request.SalesEmployeeId.HasValue && request.SalesEmployeeId.Value != Guid.Empty)
        {
            var emp = await _employeeRepository.GetByIdAsync(request.SalesEmployeeId.Value, cancellationToken);
            if (emp == null || emp.CompanyId != request.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.EmployeeNotFound", "Sales employee not found or does not belong to specified company."));
            if (!emp.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveEmployee", "Assigned sales employee is inactive."));
        }

        // Validate Location if specified
        if (request.InventoryLocationId.HasValue && request.InventoryLocationId.Value != Guid.Empty)
        {
            var loc = await _locationRepository.GetByIdAsync(request.InventoryLocationId.Value, cancellationToken);
            if (loc == null || loc.CompanyId != request.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.LocationNotFound", "Inventory location not found or does not belong to specified company."));
            if (!loc.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveLocation", "Cannot assign inactive inventory location."));
        }

        // Validate Products & Quantities
        var orderItems = new List<SalesOrderItem>();
        decimal subtotal = 0;
        decimal totalDiscount = 0;
        decimal totalTax = 0;

        foreach (var item in request.Items)
        {
            if (item.Quantity <= 0)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidQuantity", "Quantity must be strictly positive (> 0)."));
            if (item.UnitPrice < 0)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidPrice", "Unit price cannot be negative."));

            var prod = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (prod == null || prod.CompanyId != request.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.ProductNotFound", $"Product {item.ProductId} not found or does not belong to specified company."));
            if (!prod.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveProduct", $"Product '{prod.Name}' is inactive."));

            decimal lineSubtotal = item.Quantity * item.UnitPrice;
            decimal lineDiscount = Math.Max(0m, item.DiscountAmount);
            decimal lineTax = Math.Max(0m, item.TaxAmount);
            decimal lineTotal = Math.Max(0m, lineSubtotal - lineDiscount + lineTax);

            subtotal += lineSubtotal;
            totalDiscount += lineDiscount;
            totalTax += lineTax;

            orderItems.Add(new SalesOrderItem
            {
                Id = Guid.NewGuid(),
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountAmount = lineDiscount,
                TaxAmount = lineTax,
                LineTotal = lineTotal,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        decimal totalAmount = Math.Max(0m, subtotal - totalDiscount + totalTax);
        string orderNumber = await _orderRepository.GetNextOrderNumberAsync(request.CompanyId, cancellationToken);

        var order = new SalesOrder
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            CustomerId = request.CustomerId,
            SalesEmployeeId = request.SalesEmployeeId,
            InventoryLocationId = request.InventoryLocationId,
            OrderNumber = orderNumber,
            OrderStatus = SalesOrderStatuses.Draft,
            OrderDateUtc = request.OrderDateUtc ?? DateTime.UtcNow,
            Subtotal = subtotal,
            DiscountAmount = totalDiscount,
            TaxAmount = totalTax,
            TotalAmount = totalAmount,
            Notes = request.Notes,
            CreatedAtUtc = DateTime.UtcNow,
            Items = orderItems
        };

        await _orderRepository.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detail = await _orderRepository.GetByIdWithDetailsAsync(order.Id, cancellationToken);
        return Result.Success(new SalesOrderDto(
            detail!.Id,
            detail.CompanyId,
            detail.Company?.LegalName ?? "Company",
            detail.CustomerId,
            detail.Customer?.LegalName ?? "Customer",
            detail.Customer?.Code ?? "CUST",
            detail.SalesEmployeeId,
            detail.SalesEmployee != null ? $"{detail.SalesEmployee.FirstName} {detail.SalesEmployee.LastName}".Trim() : null,
            detail.InventoryLocationId,
            detail.InventoryLocation?.Name,
            detail.InventoryLocation?.Code,
            detail.OrderNumber,
            detail.OrderStatus,
            detail.OrderDateUtc,
            detail.Subtotal,
            detail.DiscountAmount,
            detail.TaxAmount,
            detail.TotalAmount,
            detail.Notes,
            detail.CreatedAtUtc,
            detail.LastModifiedAtUtc,
            detail.Items.Select(i => new SalesOrderItemDto(
                i.Id,
                i.SalesOrderId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.Quantity,
                i.UnitPrice,
                i.DiscountAmount,
                i.TaxAmount,
                i.LineTotal
            )).ToList()
        ));
    }
}

// ----------------------------------------------------
// 2. SUBMIT SALES ORDER COMMAND (Availability + Auto-Reservation)
// ----------------------------------------------------
public record SubmitSalesOrderCommand(Guid Id, Guid? CompanyId = null) : IRequest<Result<SalesOrderDto>>;

public class SubmitSalesOrderCommandHandler : IRequestHandler<SubmitSalesOrderCommand, Result<SalesOrderDto>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public SubmitSalesOrderCommandHandler(
        ISalesOrderRepository orderRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryReservationRepository reservationRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<SalesOrderDto>> Handle(SubmitSalesOrderCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidId", "Sales order ID is required."));

        var order = await _orderRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (order == null)
            return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.NotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesOrderDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company order."));

        if (order.OrderStatus != SalesOrderStatuses.Draft)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidStatus", $"Only Draft orders can be submitted. Current status: '{order.OrderStatus}'."));

        if (!order.InventoryLocationId.HasValue)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.NoLocation", "Sales order must have an assigned InventoryLocation to perform stock check and reservation."));

        var locationId = order.InventoryLocationId.Value;
        int fullyAvailableCount = 0;
        int partialOrInsufficientCount = 0;

        foreach (var item in order.Items)
        {
            var balance = await _balanceRepository.GetByLocationAndProductAsync(
                order.CompanyId,
                locationId,
                item.ProductId,
                cancellationToken);

            decimal onHand = balance?.OnHandQuantity ?? 0m;
            decimal reserved = balance?.ReservedQuantity ?? 0m;
            decimal allocated = balance?.AllocatedQuantity ?? 0m;
            decimal available = Math.Max(0m, onHand - reserved - allocated);

            if (available >= item.Quantity)
            {
                // Full quantity available -> Reserve full
                decimal qtyToReserve = item.Quantity;
                if (balance == null)
                {
                    // Create balance record if not exists
                    balance = new InventoryBalance
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = order.CompanyId,
                        InventoryLocationId = locationId,
                        ProductId = item.ProductId,
                        OnHandQuantity = 0m,
                        ReservedQuantity = qtyToReserve,
                        AllocatedQuantity = 0m,
                        CreatedAtUtc = DateTime.UtcNow
                    };
                    await _balanceRepository.AddAsync(balance, cancellationToken);
                }
                else
                {
                    balance.ReservedQuantity += qtyToReserve;
                    balance.LastModifiedAtUtc = DateTime.UtcNow;
                    await _balanceRepository.UpdateAsync(balance, cancellationToken);
                }

                var reservation = new InventoryReservation
                {
                    Id = Guid.NewGuid(),
                    CompanyId = order.CompanyId,
                    InventoryLocationId = locationId,
                    ProductId = item.ProductId,
                    SalesOrderId = order.Id,
                    SalesOrderLineId = item.Id,
                    ReservedQuantity = qtyToReserve,
                    Status = InventoryReservationStatuses.Active,
                    ReservedAtUtc = DateTime.UtcNow,
                    CreatedAtUtc = DateTime.UtcNow
                };
                await _reservationRepository.AddAsync(reservation, cancellationToken);

                fullyAvailableCount++;
            }
            else if (available > 0)
            {
                // Partial quantity available -> Reserve available portion
                decimal qtyToReserve = available;
                balance!.ReservedQuantity += qtyToReserve;
                balance.LastModifiedAtUtc = DateTime.UtcNow;
                await _balanceRepository.UpdateAsync(balance, cancellationToken);

                var reservation = new InventoryReservation
                {
                    Id = Guid.NewGuid(),
                    CompanyId = order.CompanyId,
                    InventoryLocationId = locationId,
                    ProductId = item.ProductId,
                    SalesOrderId = order.Id,
                    SalesOrderLineId = item.Id,
                    ReservedQuantity = qtyToReserve,
                    Status = InventoryReservationStatuses.Active,
                    ReservedAtUtc = DateTime.UtcNow,
                    CreatedAtUtc = DateTime.UtcNow
                };
                await _reservationRepository.AddAsync(reservation, cancellationToken);

                partialOrInsufficientCount++;
            }
            else
            {
                // Zero stock -> Cannot reserve
                partialOrInsufficientCount++;
            }
        }

        // Determine final order status based on stock check results
        if (partialOrInsufficientCount == 0)
        {
            order.OrderStatus = SalesOrderStatuses.Reserved;
        }
        else if (fullyAvailableCount > 0)
        {
            order.OrderStatus = SalesOrderStatuses.PartiallyAvailable;
        }
        else
        {
            order.OrderStatus = SalesOrderStatuses.AwaitingTransfer;
        }

        order.LastModifiedAtUtc = DateTime.UtcNow;
        await _orderRepository.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _orderRepository.GetByIdWithDetailsAsync(order.Id, cancellationToken);
        return Result.Success(new SalesOrderDto(
            updated!.Id,
            updated.CompanyId,
            updated.Company?.LegalName ?? "Company",
            updated.CustomerId,
            updated.Customer?.LegalName ?? "Customer",
            updated.Customer?.Code ?? "CUST",
            updated.SalesEmployeeId,
            updated.SalesEmployee != null ? $"{updated.SalesEmployee.FirstName} {updated.SalesEmployee.LastName}".Trim() : null,
            updated.InventoryLocationId,
            updated.InventoryLocation?.Name,
            updated.InventoryLocation?.Code,
            updated.OrderNumber,
            updated.OrderStatus,
            updated.OrderDateUtc,
            updated.Subtotal,
            updated.DiscountAmount,
            updated.TaxAmount,
            updated.TotalAmount,
            updated.Notes,
            updated.CreatedAtUtc,
            updated.LastModifiedAtUtc,
            updated.Items.Select(i => new SalesOrderItemDto(
                i.Id,
                i.SalesOrderId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.Quantity,
                i.UnitPrice,
                i.DiscountAmount,
                i.TaxAmount,
                i.LineTotal
            )).ToList()
        ));
    }
}

// ----------------------------------------------------
// 3. CANCEL SALES ORDER COMMAND (Releases active reservations)
// ----------------------------------------------------
public record CancelSalesOrderCommand(Guid Id, Guid? CompanyId = null) : IRequest<Result<SalesOrderDto>>;

public class CancelSalesOrderCommandHandler : IRequestHandler<CancelSalesOrderCommand, Result<SalesOrderDto>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CancelSalesOrderCommandHandler(
        ISalesOrderRepository orderRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryReservationRepository reservationRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<SalesOrderDto>> Handle(CancelSalesOrderCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidId", "Sales order ID is required."));

        var order = await _orderRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (order == null)
            return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.NotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesOrderDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company order."));

        if (order.OrderStatus == SalesOrderStatuses.Cancelled)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.AlreadyCancelled", "Sales order is already cancelled."));

        // Release all active reservations linked to this sales order
        var reservations = await _reservationRepository.ListAsync(
            order.CompanyId,
            salesOrderId: order.Id,
            status: InventoryReservationStatuses.Active,
            cancellationToken: cancellationToken);

        foreach (var resv in reservations)
        {
            var balance = await _balanceRepository.GetByLocationAndProductAsync(
                resv.CompanyId,
                resv.InventoryLocationId,
                resv.ProductId,
                cancellationToken);

            if (balance != null)
            {
                balance.ReservedQuantity = Math.Max(0m, balance.ReservedQuantity - resv.ReservedQuantity);
                balance.LastModifiedAtUtc = DateTime.UtcNow;
                await _balanceRepository.UpdateAsync(balance, cancellationToken);
            }

            resv.Status = InventoryReservationStatuses.Cancelled;
            resv.ReleasedAtUtc = DateTime.UtcNow;
            resv.LastModifiedAtUtc = DateTime.UtcNow;
            await _reservationRepository.UpdateAsync(resv, cancellationToken);
        }

        order.OrderStatus = SalesOrderStatuses.Cancelled;
        order.LastModifiedAtUtc = DateTime.UtcNow;
        await _orderRepository.UpdateAsync(order, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _orderRepository.GetByIdWithDetailsAsync(order.Id, cancellationToken);
        return Result.Success(new SalesOrderDto(
            updated!.Id,
            updated.CompanyId,
            updated.Company?.LegalName ?? "Company",
            updated.CustomerId,
            updated.Customer?.LegalName ?? "Customer",
            updated.Customer?.Code ?? "CUST",
            updated.SalesEmployeeId,
            updated.SalesEmployee != null ? $"{updated.SalesEmployee.FirstName} {updated.SalesEmployee.LastName}".Trim() : null,
            updated.InventoryLocationId,
            updated.InventoryLocation?.Name,
            updated.InventoryLocation?.Code,
            updated.OrderNumber,
            updated.OrderStatus,
            updated.OrderDateUtc,
            updated.Subtotal,
            updated.DiscountAmount,
            updated.TaxAmount,
            updated.TotalAmount,
            updated.Notes,
            updated.CreatedAtUtc,
            updated.LastModifiedAtUtc,
            updated.Items.Select(i => new SalesOrderItemDto(
                i.Id,
                i.SalesOrderId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.Quantity,
                i.UnitPrice,
                i.DiscountAmount,
                i.TaxAmount,
                i.LineTotal
            )).ToList()
        ));
    }
}

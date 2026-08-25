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

namespace INK.ERP.Application.Features.Sales.Orders.Queries;

public record GetSalesOrdersPagedQuery(
    Guid? CompanyId = null,
    Guid? CustomerId = null,
    Guid? SalesEmployeeId = null,
    string? Status = null,
    string? Search = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<IReadOnlyList<SalesOrderDto>>>;

public class GetSalesOrdersPagedQueryHandler : IRequestHandler<GetSalesOrdersPagedQuery, Result<IReadOnlyList<SalesOrderDto>>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSalesOrdersPagedQueryHandler(
        ISalesOrderRepository orderRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<SalesOrderDto>>> Handle(GetSalesOrdersPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<SalesOrderDto>>(new List<SalesOrderDto>());
        }

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(effectiveCompanyId.Value, cancellationToken);
            if (!hasAccess)
            {
                return Result<IReadOnlyList<SalesOrderDto>>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company."));
            }
        }

        var orders = await _orderRepository.ListAsync(
            effectiveCompanyId,
            request.CustomerId,
            request.SalesEmployeeId,
            request.Status,
            request.Search,
            request.FromDate,
            request.ToDate,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = orders.Select(o => new SalesOrderDto(
            o.Id,
            o.CompanyId,
            o.Company?.LegalName ?? o.Company?.TradeName ?? "Company",
            o.CustomerId,
            o.Customer?.LegalName ?? o.Customer?.TradeName ?? "Customer",
            o.Customer?.Code ?? "CUST",
            o.SalesEmployeeId,
            o.SalesEmployee != null ? $"{o.SalesEmployee.FirstName} {o.SalesEmployee.LastName}".Trim() : null,
            o.InventoryLocationId,
            o.InventoryLocation?.Name,
            o.InventoryLocation?.Code,
            o.OrderNumber,
            o.OrderStatus,
            o.OrderDateUtc,
            o.Subtotal,
            o.DiscountAmount,
            o.TaxAmount,
            o.TotalAmount,
            o.Notes,
            o.CreatedAtUtc,
            o.LastModifiedAtUtc,
            o.Items.Select(i => new SalesOrderItemDto(
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
        )).ToList();

        return Result.Success<IReadOnlyList<SalesOrderDto>>(dtos);
    }
}

public record GetSalesOrderByIdQuery(Guid Id) : IRequest<Result<SalesOrderDto>>;

public class GetSalesOrderByIdQueryHandler : IRequestHandler<GetSalesOrderByIdQuery, Result<SalesOrderDto>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSalesOrderByIdQueryHandler(
        ISalesOrderRepository orderRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryReservationRepository reservationRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<SalesOrderDto>> Handle(GetSalesOrderByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidId", "Sales order ID is required."));

        var o = await _orderRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (o == null)
            return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.NotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(o.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesOrderDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company order."));

        // Hydrate live stock & reservation metrics per line if location is assigned
        var itemsWithStatus = new List<SalesOrderItemDto>();
        foreach (var item in o.Items)
        {
            decimal available = 0;
            decimal reservedForOrder = 0;

            if (o.InventoryLocationId.HasValue)
            {
                var bal = await _balanceRepository.GetByLocationAndProductAsync(o.CompanyId, o.InventoryLocationId.Value, item.ProductId, cancellationToken);
                if (bal != null)
                {
                    available = Math.Max(0m, bal.OnHandQuantity - bal.ReservedQuantity - bal.AllocatedQuantity);
                }
            }

            var allReservations = await _reservationRepository.ListAsync(
                o.CompanyId,
                salesOrderId: o.Id,
                productId: item.ProductId,
                status: "Active",
                cancellationToken: cancellationToken);
            reservedForOrder = allReservations.Sum(r => r.ReservedQuantity);

            decimal shortfall = Math.Max(0m, item.Quantity - reservedForOrder);
            string stockStatus = reservedForOrder >= item.Quantity ? "FullyReserved"
                                : reservedForOrder > 0 ? "PartiallyReserved"
                                : available >= item.Quantity ? "Available" : "Insufficient";

            itemsWithStatus.Add(new SalesOrderItemDto(
                item.Id,
                item.SalesOrderId,
                item.ProductId,
                item.Product?.Name ?? "Product",
                item.Product?.Code ?? "PRD",
                item.Product?.Sku,
                item.Product?.BaseUom?.Name ?? "unit",
                item.Quantity,
                item.UnitPrice,
                item.DiscountAmount,
                item.TaxAmount,
                item.LineTotal,
                available,
                reservedForOrder,
                shortfall,
                stockStatus
            ));
        }

        var dto = new SalesOrderDto(
            o.Id,
            o.CompanyId,
            o.Company?.LegalName ?? o.Company?.TradeName ?? "Company",
            o.CustomerId,
            o.Customer?.LegalName ?? o.Customer?.TradeName ?? "Customer",
            o.Customer?.Code ?? "CUST",
            o.SalesEmployeeId,
            o.SalesEmployee != null ? $"{o.SalesEmployee.FirstName} {o.SalesEmployee.LastName}".Trim() : null,
            o.InventoryLocationId,
            o.InventoryLocation?.Name,
            o.InventoryLocation?.Code,
            o.OrderNumber,
            o.OrderStatus,
            o.OrderDateUtc,
            o.Subtotal,
            o.DiscountAmount,
            o.TaxAmount,
            o.TotalAmount,
            o.Notes,
            o.CreatedAtUtc,
            o.LastModifiedAtUtc,
            itemsWithStatus
        );

        return Result.Success(dto);
    }
}

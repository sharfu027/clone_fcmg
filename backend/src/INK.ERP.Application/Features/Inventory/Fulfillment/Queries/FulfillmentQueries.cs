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
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Features.Inventory.Fulfillment.Queries;

// ----------------------------------------------------
// 1. GET READY FOR FULFILLMENT ORDERS QUERY
// ----------------------------------------------------
public record GetReadyForFulfillmentOrdersQuery(
    Guid? CompanyId = null,
    string? Search = null,
    Guid? LocationId = null
) : IRequest<Result<IReadOnlyList<ReadyForFulfillmentOrderDto>>>;

public class GetReadyForFulfillmentOrdersQueryHandler : IRequestHandler<GetReadyForFulfillmentOrdersQuery, Result<IReadOnlyList<ReadyForFulfillmentOrderDto>>>
{
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetReadyForFulfillmentOrdersQueryHandler(
        ISalesOrderRepository salesOrderRepository,
        IInventoryReservationRepository reservationRepository,
        IPickTaskRepository pickTaskRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<ReadyForFulfillmentOrderDto>>> Handle(GetReadyForFulfillmentOrdersQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<ReadyForFulfillmentOrderDto>>(new List<ReadyForFulfillmentOrderDto>());
        }

        var compId = authorizedCompanyId ?? request.CompanyId;

        // Fetch sales orders
        var allOrders = await _salesOrderRepository.ListAsync(
            companyId: compId,
            search: request.Search,
            pageSize: 200,
            cancellationToken: cancellationToken);

        // Filter orders in ReadyForFulfillment, Reserved, or Picking
        var readyOrders = allOrders
            .Where(x => (x.OrderStatus == SalesOrderStatuses.ReadyForFulfillment || 
                         x.OrderStatus == SalesOrderStatuses.Reserved ||
                         x.OrderStatus == SalesOrderStatuses.Picking) &&
                        (!request.LocationId.HasValue || request.LocationId.Value == Guid.Empty || x.InventoryLocationId == request.LocationId.Value))
            .OrderByDescending(x => x.OrderDateUtc)
            .ToList();

        // Active pick tasks
        var pickTasks = await _pickTaskRepository.ListAsync(
            companyId: compId,
            pageSize: 500,
            cancellationToken: cancellationToken);

        var resultList = new List<ReadyForFulfillmentOrderDto>();

        foreach (var ord in readyOrders)
        {
            var ordResvs = await _reservationRepository.ListAsync(
                companyId: ord.CompanyId,
                salesOrderId: ord.Id,
                pageSize: 200,
                cancellationToken: cancellationToken);

            var activePick = pickTasks.FirstOrDefault(pt => pt.SalesOrderId == ord.Id && pt.Status != PickTaskStatuses.Cancelled);

            var itemDtos = ord.Items.Select(item =>
            {
                decimal itemResvQty = ordResvs
                    .Where(r => (r.SalesOrderLineId == item.Id || (r.SalesOrderLineId == null && r.ProductId == item.ProductId)) &&
                               (r.Status == InventoryReservationStatuses.Active || r.Status == InventoryReservationStatuses.Allocated))
                    .Sum(r => r.ReservedQuantity);

                return new ReadyForFulfillmentOrderItemDto(
                    item.Id,
                    item.ProductId,
                    item.Product?.Name ?? "Product",
                    item.Product?.Code ?? "PRD",
                    item.Product?.Sku,
                    item.Product?.BaseUom?.Name ?? "unit",
                    item.Quantity,
                    itemResvQty,
                    item.UnitPrice,
                    item.LineTotal
                );
            }).ToList();

            decimal totalQty = itemDtos.Sum(i => i.RequestedQuantity);
            decimal totalResv = itemDtos.Sum(i => i.ReservedQuantity);

            resultList.Add(new ReadyForFulfillmentOrderDto(
                ord.Id,
                ord.CompanyId,
                ord.Company?.LegalName ?? "Company",
                ord.CustomerId,
                ord.Customer?.LegalName ?? "Customer",
                ord.Customer?.Code ?? "CUST",
                ord.SalesEmployeeId,
                ord.SalesEmployee != null ? $"{ord.SalesEmployee.FirstName} {ord.SalesEmployee.LastName}".Trim() : null,
                ord.InventoryLocationId,
                ord.InventoryLocation?.Name,
                ord.InventoryLocation?.Code,
                ord.OrderNumber,
                ord.OrderStatus,
                ord.OrderDateUtc,
                ord.TotalAmount,
                ord.Items.Count,
                totalQty,
                totalResv,
                activePick != null,
                activePick?.Id,
                activePick?.PickTaskNumber,
                activePick?.Status,
                itemDtos
            ));
        }

        return Result.Success<IReadOnlyList<ReadyForFulfillmentOrderDto>>(resultList);
    }
}

// ----------------------------------------------------
// 2. GET PICK TASKS PAGED QUERY
// ----------------------------------------------------
public record GetPickTasksPagedQuery(
    Guid? CompanyId = null,
    Guid? SalesOrderId = null,
    Guid? LocationId = null,
    Guid? EmployeeId = null,
    string? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<IReadOnlyList<PickTaskDto>>>;

public class GetPickTasksPagedQueryHandler : IRequestHandler<GetPickTasksPagedQuery, Result<IReadOnlyList<PickTaskDto>>>
{
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetPickTasksPagedQueryHandler(
        IPickTaskRepository pickTaskRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<PickTaskDto>>> Handle(GetPickTasksPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
            return Result.Success<IReadOnlyList<PickTaskDto>>(new List<PickTaskDto>());

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var tasks = await _pickTaskRepository.ListAsync(
            targetCompanyId,
            request.SalesOrderId,
            request.LocationId,
            request.EmployeeId,
            request.Status,
            request.FromDate,
            request.ToDate,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = tasks.Select(MapPickTaskDto).ToList();
        return Result.Success<IReadOnlyList<PickTaskDto>>(dtos);
    }

    private static PickTaskDto MapPickTaskDto(PickTask t) => new(
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
// 3. GET PICK TASK BY ID QUERY
// ----------------------------------------------------
public record GetPickTaskByIdQuery(Guid Id) : IRequest<Result<PickTaskDto>>;

public class GetPickTaskByIdQueryHandler : IRequestHandler<GetPickTaskByIdQuery, Result<PickTaskDto>>
{
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetPickTaskByIdQueryHandler(
        IPickTaskRepository pickTaskRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<PickTaskDto>> Handle(GetPickTaskByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<PickTaskDto>.Failure(Error.Validation("PickTask.InvalidId", "Pick task ID is required."));

        var t = await _pickTaskRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (t == null)
            return Result<PickTaskDto>.Failure(Error.NotFound("PickTask.NotFound", "Pick task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(t.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PickTaskDto>.Failure(Error.Unauthorized("PickTask.Unauthorized", "Unauthorized access to requested pick task."));

        var dto = new PickTaskDto(
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

        return Result.Success(dto);
    }
}

// ----------------------------------------------------
// 4. GET PACK TASKS PAGED QUERY
// ----------------------------------------------------
public record GetPackTasksPagedQuery(
    Guid? CompanyId = null,
    Guid? SalesOrderId = null,
    Guid? PickTaskId = null,
    Guid? EmployeeId = null,
    string? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<IReadOnlyList<PackTaskDto>>>;

public class GetPackTasksPagedQueryHandler : IRequestHandler<GetPackTasksPagedQuery, Result<IReadOnlyList<PackTaskDto>>>
{
    private readonly IPackTaskRepository _packTaskRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetPackTasksPagedQueryHandler(
        IPackTaskRepository packTaskRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _packTaskRepository = packTaskRepository ?? throw new ArgumentNullException(nameof(packTaskRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<PackTaskDto>>> Handle(GetPackTasksPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
            return Result.Success<IReadOnlyList<PackTaskDto>>(new List<PackTaskDto>());

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var tasks = await _packTaskRepository.ListAsync(
            targetCompanyId,
            request.SalesOrderId,
            request.PickTaskId,
            request.EmployeeId,
            request.Status,
            request.FromDate,
            request.ToDate,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = tasks.Select(MapPackTaskDto).ToList();
        return Result.Success<IReadOnlyList<PackTaskDto>>(dtos);
    }

    private static PackTaskDto MapPackTaskDto(PackTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.PickTaskId,
        t.PickTask?.PickTaskNumber ?? "PK",
        t.PackTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.TotalPackagesCount,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Packages.Select(p => new PackageDto(
            p.Id,
            p.PackTaskId,
            p.PackageNumber,
            p.PackageType,
            p.GrossWeightKg,
            p.Length,
            p.Width,
            p.Height,
            p.SealNumber,
            p.Barcode,
            p.PackedByEmployeeId,
            p.PackedByEmployee != null ? $"{p.PackedByEmployee.FirstName} {p.PackedByEmployee.LastName}".Trim() : null,
            p.PackedAtUtc,
            p.Items.Select(i => new PackageItemDto(
                i.Id,
                i.PackageId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.PackedQuantity,
                i.BatchNumber
            )).ToList()
        )).ToList()
    );
}

// ----------------------------------------------------
// 5. GET PACK TASK BY ID QUERY
// ----------------------------------------------------
public record GetPackTaskByIdQuery(Guid Id) : IRequest<Result<PackTaskDto>>;

public class GetPackTaskByIdQueryHandler : IRequestHandler<GetPackTaskByIdQuery, Result<PackTaskDto>>
{
    private readonly IPackTaskRepository _packTaskRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetPackTaskByIdQueryHandler(
        IPackTaskRepository packTaskRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _packTaskRepository = packTaskRepository ?? throw new ArgumentNullException(nameof(packTaskRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<PackTaskDto>> Handle(GetPackTaskByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidId", "Pack task ID is required."));

        var t = await _packTaskRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (t == null)
            return Result<PackTaskDto>.Failure(Error.NotFound("PackTask.NotFound", "Pack task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(t.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PackTaskDto>.Failure(Error.Unauthorized("PackTask.Unauthorized", "Unauthorized access to requested pack task."));

        var dto = new PackTaskDto(
            t.Id,
            t.CompanyId,
            t.Company?.LegalName ?? "Company",
            t.SalesOrderId,
            t.SalesOrder?.OrderNumber ?? "SO",
            t.SalesOrder?.CustomerId ?? Guid.Empty,
            t.SalesOrder?.Customer?.LegalName ?? "Customer",
            t.PickTaskId,
            t.PickTask?.PickTaskNumber ?? "PK",
            t.PackTaskNumber,
            t.AssignedEmployeeId,
            t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
            t.AssignedEmployee?.EmployeeCode,
            t.Status,
            t.TotalPackagesCount,
            t.StartedAtUtc,
            t.CompletedAtUtc,
            t.Notes,
            t.ConcurrencyToken,
            t.CreatedAtUtc,
            t.Packages.Select(p => new PackageDto(
                p.Id,
                p.PackTaskId,
                p.PackageNumber,
                p.PackageType,
                p.GrossWeightKg,
                p.Length,
                p.Width,
                p.Height,
                p.SealNumber,
                p.Barcode,
                p.PackedByEmployeeId,
                p.PackedByEmployee != null ? $"{p.PackedByEmployee.FirstName} {p.PackedByEmployee.LastName}".Trim() : null,
                p.PackedAtUtc,
                p.Items.Select(i => new PackageItemDto(
                    i.Id,
                    i.PackageId,
                    i.ProductId,
                    i.Product?.Name ?? "Product",
                    i.Product?.Code ?? "PRD",
                    i.Product?.Sku,
                    i.Product?.BaseUom?.Name ?? "unit",
                    i.PackedQuantity,
                    i.BatchNumber
                )).ToList()
            )).ToList()
        );

        return Result.Success(dto);
    }
}

// ----------------------------------------------------
// 6. GET DISPATCHES PAGED QUERY
// ----------------------------------------------------
public record GetDispatchesPagedQuery(
    Guid? CompanyId = null,
    Guid? SalesOrderId = null,
    Guid? PackTaskId = null,
    string? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<IReadOnlyList<DispatchDto>>>;

public class GetDispatchesPagedQueryHandler : IRequestHandler<GetDispatchesPagedQuery, Result<IReadOnlyList<DispatchDto>>>
{
    private readonly IDispatchRepository _dispatchRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDispatchesPagedQueryHandler(
        IDispatchRepository dispatchRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _dispatchRepository = dispatchRepository ?? throw new ArgumentNullException(nameof(dispatchRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<DispatchDto>>> Handle(GetDispatchesPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
            return Result.Success<IReadOnlyList<DispatchDto>>(new List<DispatchDto>());

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var dispatches = await _dispatchRepository.ListAsync(
            targetCompanyId,
            request.SalesOrderId,
            request.PackTaskId,
            request.Status,
            request.FromDate,
            request.ToDate,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = dispatches.Select(MapDispatchDto).ToList();
        return Result.Success<IReadOnlyList<DispatchDto>>(dtos);
    }

    private static DispatchDto MapDispatchDto(Dispatch d) => new(
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
// 7. GET DISPATCH BY ID QUERY
// ----------------------------------------------------
public record GetDispatchByIdQuery(Guid Id) : IRequest<Result<DispatchDto>>;

public class GetDispatchByIdQueryHandler : IRequestHandler<GetDispatchByIdQuery, Result<DispatchDto>>
{
    private readonly IDispatchRepository _dispatchRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDispatchByIdQueryHandler(
        IDispatchRepository dispatchRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _dispatchRepository = dispatchRepository ?? throw new ArgumentNullException(nameof(dispatchRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<DispatchDto>> Handle(GetDispatchByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<DispatchDto>.Failure(Error.Validation("Dispatch.InvalidId", "Dispatch ID is required."));

        var d = await _dispatchRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (d == null)
            return Result<DispatchDto>.Failure(Error.NotFound("Dispatch.NotFound", "Dispatch not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(d.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<DispatchDto>.Failure(Error.Unauthorized("Dispatch.Unauthorized", "Unauthorized access to requested dispatch."));

        var dto = new DispatchDto(
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

        return Result.Success(dto);
    }
}

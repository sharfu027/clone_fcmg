using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Sales.Delivery.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Features.Sales.Delivery.Commands;

public record CreateOrUpdateDeliveryTrackingCommand(
    Guid SalesOrderId,
    Guid? DispatchId,
    string Status = DeliveryStatuses.Dispatched,
    string? CarrierName = null,
    string? VehicleNumber = null,
    string? DriverName = null,
    string? DriverPhone = null,
    DateTime? EstimatedDeliveryUtc = null,
    DateTime? ActualDeliveryUtc = null,
    string? ReceivedByPerson = null,
    string? SignatureProofUrl = null,
    double? CurrentLatitude = null,
    double? CurrentLongitude = null,
    string? Notes = null
) : IRequest<Result<DeliveryTrackingDto>>;

public class CreateOrUpdateDeliveryTrackingCommandHandler : IRequestHandler<CreateOrUpdateDeliveryTrackingCommand, Result<DeliveryTrackingDto>>
{
    private readonly IDeliveryTrackingRepository _trackingRepository;
    private readonly ISalesOrderRepository _orderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CreateOrUpdateDeliveryTrackingCommandHandler(
        IDeliveryTrackingRepository trackingRepository,
        ISalesOrderRepository orderRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _trackingRepository = trackingRepository ?? throw new ArgumentNullException(nameof(trackingRepository));
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<DeliveryTrackingDto>> Handle(CreateOrUpdateDeliveryTrackingCommand request, CancellationToken cancellationToken)
    {
        if (request.SalesOrderId == Guid.Empty)
            return Result<DeliveryTrackingDto>.Failure(Error.Validation("Delivery.InvalidOrderId", "Sales order ID is required."));

        var order = await _orderRepository.GetByIdWithDetailsAsync(request.SalesOrderId, cancellationToken);
        if (order == null)
            return Result<DeliveryTrackingDto>.Failure(Error.NotFound("Delivery.OrderNotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<DeliveryTrackingDto>.Failure(Error.Unauthorized("Delivery.Unauthorized", "Unauthorized access to company order."));

        var existing = await _trackingRepository.GetBySalesOrderIdAsync(order.CompanyId, order.Id, cancellationToken);

        if (existing == null)
        {
            string trackingNumber = await _trackingRepository.GetNextTrackingNumberAsync(order.CompanyId, cancellationToken);
            existing = new DeliveryTracking
            {
                Id = Guid.NewGuid(),
                CompanyId = order.CompanyId,
                SalesOrderId = order.Id,
                DispatchId = request.DispatchId,
                TrackingNumber = trackingNumber,
                Status = request.Status,
                CarrierName = request.CarrierName,
                VehicleNumber = request.VehicleNumber,
                DriverName = request.DriverName,
                DriverPhone = request.DriverPhone,
                EstimatedDeliveryUtc = request.EstimatedDeliveryUtc ?? DateTime.UtcNow.AddDays(2),
                ActualDeliveryUtc = request.ActualDeliveryUtc,
                ReceivedByPerson = request.ReceivedByPerson,
                SignatureProofUrl = request.SignatureProofUrl,
                CurrentLatitude = request.CurrentLatitude,
                CurrentLongitude = request.CurrentLongitude,
                Notes = request.Notes,
                CreatedAtUtc = DateTime.UtcNow
            };

            await _trackingRepository.AddAsync(existing, cancellationToken);
        }
        else
        {
            existing.Status = request.Status;
            if (request.CarrierName != null) existing.CarrierName = request.CarrierName;
            if (request.VehicleNumber != null) existing.VehicleNumber = request.VehicleNumber;
            if (request.DriverName != null) existing.DriverName = request.DriverName;
            if (request.DriverPhone != null) existing.DriverPhone = request.DriverPhone;
            if (request.EstimatedDeliveryUtc.HasValue) existing.EstimatedDeliveryUtc = request.EstimatedDeliveryUtc;
            if (request.ActualDeliveryUtc.HasValue) existing.ActualDeliveryUtc = request.ActualDeliveryUtc;
            if (request.ReceivedByPerson != null) existing.ReceivedByPerson = request.ReceivedByPerson;
            if (request.SignatureProofUrl != null) existing.SignatureProofUrl = request.SignatureProofUrl;
            if (request.CurrentLatitude.HasValue) existing.CurrentLatitude = request.CurrentLatitude;
            if (request.CurrentLongitude.HasValue) existing.CurrentLongitude = request.CurrentLongitude;
            if (request.Notes != null) existing.Notes = request.Notes;
            existing.LastModifiedAtUtc = DateTime.UtcNow;

            await _trackingRepository.UpdateAsync(existing, cancellationToken);
        }

        // If delivered, update SalesOrder status to Completed / Delivered
        if (request.Status == DeliveryStatuses.Delivered)
        {
            order.OrderStatus = SalesOrderStatuses.Completed;
            order.LastModifiedAtUtc = DateTime.UtcNow;
            await _orderRepository.UpdateAsync(order, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _trackingRepository.GetByIdAsync(existing.Id, cancellationToken);
        return Result.Success(MapDelivery(updated!));
    }

    public static DeliveryTrackingDto MapDelivery(DeliveryTracking d) => new(
        d.Id,
        d.CompanyId,
        d.Company?.LegalName ?? "Company",
        d.SalesOrderId,
        d.SalesOrder?.OrderNumber ?? "SO",
        d.SalesOrder?.CustomerId,
        d.SalesOrder?.Customer?.LegalName,
        d.DispatchId,
        d.TrackingNumber,
        d.Status,
        d.CarrierName,
        d.VehicleNumber,
        d.DriverName,
        d.DriverPhone,
        d.EstimatedDeliveryUtc,
        d.ActualDeliveryUtc,
        d.ReceivedByPerson,
        d.SignatureProofUrl,
        d.CurrentLatitude,
        d.CurrentLongitude,
        d.Notes,
        d.CreatedAtUtc,
        d.LastModifiedAtUtc
    );
}

public record GetDeliveryTrackingByOrderIdQuery(Guid SalesOrderId) : IRequest<Result<DeliveryTrackingDto>>;

public class GetDeliveryTrackingByOrderIdQueryHandler : IRequestHandler<GetDeliveryTrackingByOrderIdQuery, Result<DeliveryTrackingDto>>
{
    private readonly IDeliveryTrackingRepository _trackingRepository;
    private readonly ISalesOrderRepository _orderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetDeliveryTrackingByOrderIdQueryHandler(
        IDeliveryTrackingRepository trackingRepository,
        ISalesOrderRepository orderRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _trackingRepository = trackingRepository ?? throw new ArgumentNullException(nameof(trackingRepository));
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<DeliveryTrackingDto>> Handle(GetDeliveryTrackingByOrderIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(request.SalesOrderId, cancellationToken);
        if (order == null)
            return Result<DeliveryTrackingDto>.Failure(Error.NotFound("Delivery.OrderNotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<DeliveryTrackingDto>.Failure(Error.Unauthorized("Delivery.Unauthorized", "Unauthorized access to company order."));

        var tracking = await _trackingRepository.GetBySalesOrderIdAsync(order.CompanyId, order.Id, cancellationToken);
        if (tracking == null)
            return Result<DeliveryTrackingDto>.Failure(Error.NotFound("Delivery.NotFound", "Delivery tracking not found for this order."));

        return Result.Success(CreateOrUpdateDeliveryTrackingCommandHandler.MapDelivery(tracking));
    }
}

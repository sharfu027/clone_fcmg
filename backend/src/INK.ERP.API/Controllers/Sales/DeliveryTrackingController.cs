using System;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Sales.Delivery.Commands;
using INK.ERP.Application.Features.Sales.Delivery.DTOs;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.API.Controllers.Sales;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sales/delivery")]
public class DeliveryTrackingController : BaseApiController
{
    [HttpPost("orders/{salesOrderId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(DeliveryTrackingDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateOrUpdateDelivery(
        Guid salesOrderId,
        [FromBody] UpdateDeliveryStatusRequest request,
        [FromQuery] Guid? dispatchId,
        CancellationToken cancellationToken)
    {
        var command = new CreateOrUpdateDeliveryTrackingCommand(
            salesOrderId,
            dispatchId,
            request.Status,
            request.CarrierName,
            request.VehicleNumber,
            request.DriverName,
            request.DriverPhone,
            EstimatedDeliveryUtc: null,
            ActualDeliveryUtc: request.Status == DeliveryStatuses.Delivered ? DateTime.UtcNow : null,
            request.ReceivedByPerson,
            request.SignatureProofUrl,
            request.CurrentLatitude,
            request.CurrentLongitude,
            request.Notes
        );

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("orders/{salesOrderId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(DeliveryTrackingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDeliveryByOrderId(Guid salesOrderId, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetDeliveryTrackingByOrderIdQuery(salesOrderId), cancellationToken);
        return HandleResult(result);
    }
}

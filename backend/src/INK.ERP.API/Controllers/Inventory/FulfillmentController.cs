using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Inventory.Fulfillment.DTOs;
using INK.ERP.Application.Features.Inventory.Fulfillment.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory/fulfillment")]
public class FulfillmentController : BaseApiController
{
    [HttpGet("ready-orders")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<ReadyForFulfillmentOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReadyOrders(
        [FromQuery] Guid? companyId,
        [FromQuery] string? search,
        [FromQuery] Guid? locationId,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetReadyForFulfillmentOrdersQuery(companyId, search, locationId), cancellationToken);
        return HandleResult(result);
    }
}

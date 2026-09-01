using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Inventory.Policies.Commands;
using INK.ERP.Application.Features.Inventory.Policies.DTOs;
using INK.ERP.Application.Features.Inventory.Policies.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory/policies")]
public class InventoryStockPoliciesController : BaseApiController
{
    /// <summary>
    /// Retrieves inventory stock safety and reorder policies by company, location, or product.
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryStockPolicyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPolicies(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? inventoryLocationId,
        [FromQuery] Guid? productId,
        CancellationToken cancellationToken = default)
    {
        var query = new GetInventoryStockPoliciesQuery(companyId, inventoryLocationId, productId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Upserts a stock safety threshold and reorder policy for a product at a specific inventory location.
    /// </summary>
    [HttpPut]
    [Authorize]
    [ProducesResponseType(typeof(InventoryStockPolicyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpsertPolicy(
        [FromBody] UpsertInventoryStockPolicyRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpsertInventoryStockPolicyCommand(
            request.CompanyId,
            request.InventoryLocationId,
            request.ProductId,
            request.MinStockQuantity,
            request.ReorderPoint,
            request.ReorderQuantity);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

public record UpsertInventoryStockPolicyRequest(
    Guid CompanyId,
    Guid InventoryLocationId,
    Guid ProductId,
    decimal MinStockQuantity,
    decimal? ReorderPoint = null,
    decimal? ReorderQuantity = null);

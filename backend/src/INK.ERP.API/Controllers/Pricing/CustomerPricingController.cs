using System;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Pricing.CustomerPricing.Commands;
using INK.ERP.Application.Features.Pricing.CustomerPricing.DTOs;
using INK.ERP.Application.Features.Pricing.CustomerPricing.Queries;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.API.Controllers.Pricing;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/pricing/customer-pricing")]
[ApiController]
[Authorize]
public class CustomerPricingController : BaseApiController
{
    private static readonly Guid DefaultCompanyId = Guid.Parse("76b29511-ea74-422a-928f-f5ef3abd8d80");

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CustomerPriceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomerPrices(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? productId,
        [FromQuery] Guid? priceListId,
        [FromQuery] CustomerPriceStatus? status,
        [FromQuery] string? currency,
        [FromQuery] DateTime? effectiveDate,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        Guid targetCompanyId = companyId ?? DefaultCompanyId;
        var query = new GetCustomerPricesQuery(targetCompanyId, customerId, productId, priceListId, status, currency, effectiveDate, search, pageNumber, pageSize);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CustomerPriceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomerPriceById([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetCustomerPriceByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(CustomerPriceDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCustomerPrice([FromBody] CreateCustomerPriceDto dto, CancellationToken cancellationToken = default)
    {
        Guid targetCompanyId = dto.CompanyId != Guid.Empty ? dto.CompanyId : DefaultCompanyId;
        var command = new CreateCustomerPriceCommand(
            targetCompanyId, dto.CustomerId, dto.PriceListId, dto.ProductId,
            dto.CustomerPriceValue, dto.CurrencyCode, dto.EffectiveFrom, dto.EffectiveTo, dto.Status);

        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CustomerPriceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateCustomerPrice([FromRoute] Guid id, [FromBody] UpdateCustomerPriceDto dto, CancellationToken cancellationToken = default)
    {
        var command = new UpdateCustomerPriceCommand(id, dto.CustomerPriceValue, dto.EffectiveFrom, dto.EffectiveTo, dto.Status);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(typeof(CustomerPriceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActivateCustomerPrice([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ActivateCustomerPriceCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(typeof(CustomerPriceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeactivateCustomerPrice([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeactivateCustomerPriceCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/archive")]
    [ProducesResponseType(typeof(CustomerPriceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ArchiveCustomerPrice([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ArchiveCustomerPriceCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCustomerPrice([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeleteCustomerPriceCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/duplicate")]
    [ProducesResponseType(typeof(CustomerPriceDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> DuplicateCustomerPrice([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DuplicateCustomerPriceCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleCreatedResult(result, nameof(GetCustomerPriceById), new { id = result.IsSuccess ? result.Value.Id : Guid.Empty });
    }

    [HttpGet("resolve")]
    [ProducesResponseType(typeof(PriceResolutionResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResolvePrice(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid customerId,
        [FromQuery] Guid productId,
        [FromQuery] DateTime? targetDate,
        CancellationToken cancellationToken = default)
    {
        Guid targetCompanyId = companyId ?? DefaultCompanyId;
        var query = new ResolvePriceQuery(targetCompanyId, customerId, productId, targetDate);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }
}

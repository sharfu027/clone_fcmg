using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Pricing.PriceLists.Commands;
using INK.ERP.Application.Features.Pricing.PriceLists.DTOs;
using INK.ERP.Application.Features.Pricing.PriceLists.Queries;

namespace INK.ERP.API.Controllers.Pricing;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/pricing/price-lists")]
[ApiController]
[Authorize]
public class PriceListsController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of price lists with optional company, status, and search filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<PriceListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPriceLists(
        [FromQuery] Guid? companyId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPriceListsQuery(companyId, status, search, pageNumber, pageSize);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single price list by ID including line items.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PriceListDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPriceListById([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetPriceListByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new Price List with line items in Draft status.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PriceListDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreatePriceList([FromBody] CreatePriceListDto dto, CancellationToken cancellationToken = default)
    {
        var command = new CreatePriceListCommand(
            dto.CompanyId,
            dto.Name,
            dto.Description,
            dto.EffectiveFrom,
            dto.EffectiveTo,
            dto.Items);

        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return CreatedAtAction(nameof(GetPriceListById), new { id = result.Value.Id }, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing Price List header and line items.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(PriceListDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdatePriceList([FromRoute] Guid id, [FromBody] UpdatePriceListDto dto, CancellationToken cancellationToken = default)
    {
        if (id != dto.Id)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Route ID Mismatch",
                Detail = "The price list ID in the route URL does not match the payload ID.",
                Instance = HttpContext.Request.Path
            });
        }

        var command = new UpdatePriceListCommand(
            dto.Id,
            dto.CompanyId,
            dto.Name,
            dto.Description,
            dto.EffectiveFrom,
            dto.EffectiveTo,
            dto.ConcurrencyToken,
            dto.Items);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Publishes a draft Price List, incrementing its version number.
    /// </summary>
    [HttpPost("{id:guid}/publish")]
    [ProducesResponseType(typeof(PriceListDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PublishPriceList([FromRoute] Guid id, [FromQuery] string concurrencyToken, CancellationToken cancellationToken = default)
    {
        var command = new PublishPriceListCommand(id, concurrencyToken);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Archives an active or published Price List.
    /// </summary>
    [HttpPost("{id:guid}/archive")]
    [ProducesResponseType(typeof(PriceListDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ArchivePriceList([FromRoute] Guid id, [FromQuery] string concurrencyToken, CancellationToken cancellationToken = default)
    {
        var command = new ArchivePriceListCommand(id, concurrencyToken);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Soft-deletes a Price List and its associated line items.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePriceList([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeletePriceListCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Pricing.DiscountPricing.Commands;
using INK.ERP.Application.Features.Pricing.DiscountPricing.DTOs;
using INK.ERP.Application.Features.Pricing.DiscountPricing.Queries;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.API.Controllers.Pricing;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/pricing/discount-rules")]
[ApiController]
[Authorize]
public class DiscountRulesController : BaseApiController
{
    private static readonly Guid DefaultCompanyId = Guid.Parse("76b29511-ea74-422a-928f-f5ef3abd8d80");

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<DiscountRuleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDiscountRules(
        [FromQuery] Guid? companyId,
        [FromQuery] DiscountScope? scope,
        [FromQuery] DiscountMethod? method,
        [FromQuery] DiscountRuleStatus? status,
        [FromQuery] DateTime? effectiveDate,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetDiscountRulesQuery(companyId, scope, method, status, effectiveDate, search, pageNumber, pageSize);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DiscountRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDiscountRuleById([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetDiscountRuleByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(DiscountRuleDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateDiscountRule([FromBody] CreateDiscountRuleDto dto, CancellationToken cancellationToken = default)
    {
        Guid targetCompanyId = dto.CompanyId != Guid.Empty ? dto.CompanyId : DefaultCompanyId;
        var command = new CreateDiscountRuleCommand(
            targetCompanyId, dto.RuleCode, dto.RuleName, dto.Description,
            dto.DiscountMethod, dto.DiscountValue, dto.Scope,
            dto.CustomerId, dto.ProductId, dto.CategoryId, dto.PriceListId,
            dto.MinimumQuantity, dto.MaximumQuantity, dto.MaximumDiscountAmount,
            dto.EffectiveFrom, dto.EffectiveTo, dto.Priority, dto.Status);

        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DiscountRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateDiscountRule([FromRoute] Guid id, [FromBody] UpdateDiscountRuleDto dto, CancellationToken cancellationToken = default)
    {
        var command = new UpdateDiscountRuleCommand(
            id, dto.RuleName, dto.Description,
            dto.DiscountMethod, dto.DiscountValue, dto.Scope,
            dto.CustomerId, dto.ProductId, dto.CategoryId, dto.PriceListId,
            dto.MinimumQuantity, dto.MaximumQuantity, dto.MaximumDiscountAmount,
            dto.EffectiveFrom, dto.EffectiveTo, dto.Priority, dto.Status);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(typeof(DiscountRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActivateDiscountRule([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ActivateDiscountRuleCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(typeof(DiscountRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeactivateDiscountRule([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeactivateDiscountRuleCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/archive")]
    [ProducesResponseType(typeof(DiscountRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ArchiveDiscountRule([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ArchiveDiscountRuleCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteDiscountRule([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeleteDiscountRuleCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/duplicate")]
    [ProducesResponseType(typeof(DiscountRuleDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> DuplicateDiscountRule([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DuplicateDiscountRuleCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleCreatedResult(result, nameof(GetDiscountRuleById), new { id = result.IsSuccess ? result.Value.Id : Guid.Empty });
    }

    [HttpGet("{id:guid}/history")]
    [ProducesResponseType(typeof(IReadOnlyList<DiscountRuleHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDiscountRuleHistory([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetDiscountRuleHistoryQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    public record CalculateDiscountApiRequest(
        Guid? CompanyId,
        Guid? CustomerId,
        Guid? ProductId,
        Guid? CategoryId,
        Guid? PriceListId,
        decimal Quantity,
        decimal ResolvedUnitPrice,
        DateTime? EffectiveDate
    );

    [HttpPost("calculate")]
    [ProducesResponseType(typeof(DiscountCalculationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> CalculateDiscount([FromBody] CalculateDiscountApiRequest req, CancellationToken cancellationToken = default)
    {
        Guid targetCompanyId = req.CompanyId ?? DefaultCompanyId;
        var query = new CalculateDiscountQuery(
            targetCompanyId, req.CustomerId, req.ProductId, req.CategoryId, req.PriceListId,
            req.Quantity, req.ResolvedUnitPrice, req.EffectiveDate);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }
}

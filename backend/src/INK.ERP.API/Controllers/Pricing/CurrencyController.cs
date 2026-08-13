using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Application.Features.Pricing.Currency.Commands;
using INK.ERP.Application.Features.Pricing.Currency.DTOs;
using INK.ERP.Application.Features.Pricing.Currency.Queries;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.API.Controllers.Pricing;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/pricing/currencies")]
[Authorize]
public sealed class CurrencyController : BaseApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CurrencyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetCurrenciesQuery(), ct));

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(CurrencyDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetCurrencyDashboardQuery(), ct));

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateCurrencyCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return result.IsSuccess ? StatusCode(201, result.Value) : HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCurrencyCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest();
        return HandleResult(await Mediator.Send(command, ct));
    }

    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new ActivateCurrencyCommand(id), ct));

    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new DeactivateCurrencyCommand(id), ct));
}

using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Application.Features.Pricing.Currency.Commands;
using INK.ERP.Application.Features.Pricing.Currency.DTOs;
using INK.ERP.Application.Features.Pricing.Currency.Queries;

namespace INK.ERP.API.Controllers.Pricing;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/pricing/exchange-rates")]
[Authorize]
public sealed class ExchangeRateController : BaseApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ExchangeRateDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetExchangeRatesQuery(), ct));

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateExchangeRateCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return result.IsSuccess ? StatusCode(201, result.Value) : HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateExchangeRateCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest();
        return HandleResult(await Mediator.Send(command, ct));
    }

    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new ActivateExchangeRateCommand(id), ct));

    [HttpPatch("{id:guid}/archive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new ArchiveExchangeRateCommand(id), ct));
}

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.MasterData.Companies.Commands;
using INK.ERP.Application.Features.MasterData.Companies.DTOs;
using INK.ERP.Application.Features.MasterData.Companies.Queries;

namespace INK.ERP.API.Controllers.MasterData;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/masters/company")]
[ApiController]
[Authorize(Policy = "Masters.Company")]
public class CompanyController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of company profiles with optional search and status filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CompanyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCompanies(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetCompaniesPagedQuery(pageNumber, pageSize, search, status);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Lightweight lookup endpoint returning ID, Code, LegalName, and Currency for UI selectors.
    /// </summary>
    [HttpGet("lookup")]
    [ProducesResponseType(typeof(IReadOnlyList<CompanyLookupDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCompanyLookup(CancellationToken cancellationToken = default)
    {
        var query = new GetCompanyLookupQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves all active, non-archived companies.
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(IReadOnlyList<CompanyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveCompanies(CancellationToken cancellationToken = default)
    {
        var query = new GetActiveCompaniesQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Computes the next unique sequential company code.
    /// </summary>
    [HttpGet("next-code")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextCompanyCode(CancellationToken cancellationToken = default)
    {
        var query = new GetNextCompanyCodeQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single company profile by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCompanyById([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetCompanyByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new legal company profile.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "Masters.Companies.Create")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyCommand command, CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return CreatedAtAction(nameof(GetCompanyById), new { id = result.Value.Id }, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing company profile with optimistic concurrency check.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Masters.Companies.Update")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateCompany([FromRoute] Guid id, [FromBody] UpdateCompanyCommand command, CancellationToken cancellationToken = default)
    {
        if (id != command.Id)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Route ID Mismatch",
                Detail = "The company ID in the route URL does not match the command payload ID.",
                Instance = HttpContext.Request.Path
            });
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Transitions a company profile status to Archived.
    /// </summary>
    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = "Masters.Companies.Archive")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveCompany([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ArchiveCompanyCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Restores an archived or soft-deleted company profile to Active status.
    /// </summary>
    [HttpPost("{id:guid}/restore")]
    [Authorize(Policy = "Masters.Companies.Restore")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreCompany([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new RestoreCompanyCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Soft-deletes a company profile.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Masters.Companies.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCompany([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeleteCompanyCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

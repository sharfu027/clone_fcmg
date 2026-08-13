using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.API.Models;
using INK.ERP.Application.Features.MasterData.Categories.Commands;
using INK.ERP.Application.Features.MasterData.Categories.DTOs;
using INK.ERP.Application.Features.MasterData.Categories.Queries;

namespace INK.ERP.API.Controllers.MasterData;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/masters/category")]
public class CategoryController : BaseApiController
{
    /// <summary>
    /// Retrieves a paged list of product categories with optional company filter, search, and status.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(IReadOnlyList<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories([FromQuery] Guid? companyId, [FromQuery] SecurityFilterParameters filter, CancellationToken cancellationToken)
    {
        var query = new GetCategoriesPagedQuery(companyId, filter.Page, filter.PageSize, filter.Search, filter.Status);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single category by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Read")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCategoryById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetCategoryByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new product category.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IAM.Users.Create")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing product category.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Route ID Mismatch",
                Detail = "The category ID in the route URL does not match the command payload ID.",
                Instance = HttpContext.Request.Path
            });
        }

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Deactivates / soft-deletes a product category.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "IAM.Users.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteCategoryCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

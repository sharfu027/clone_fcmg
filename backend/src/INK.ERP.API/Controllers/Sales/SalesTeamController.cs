using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.Application.Features.MasterData.Customers.DTOs;
using INK.ERP.Application.Features.SalesTeam.Commands;
using INK.ERP.Application.Features.SalesTeam.DTOs;
using INK.ERP.Application.Features.SalesTeam.Queries;

namespace INK.ERP.API.Controllers.Sales;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sales/team")]
[Authorize]
public class SalesTeamController : BaseApiController
{
    /// <summary>
    /// List sales representatives belonging to the current user's authorized company.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "SalesTeam.View")]
    [ProducesResponseType(typeof(IReadOnlyList<SalesRepresentativeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesTeam(
        [FromQuery] Guid? companyId,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] Guid? branchId,
        CancellationToken cancellationToken)
    {
        var query = new GetSalesRepresentativesQuery(companyId, search, status, branchId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get details of a specific sales representative.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "SalesTeam.View")]
    [ProducesResponseType(typeof(SalesRepresentativeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSalesRepresentativeById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetSalesRepresentativeByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new sales representative for the current authorized company.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(typeof(SalesRepresentativeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateSalesRepresentative(
        [FromBody] CreateSalesRepresentativeRequest request,
        [FromQuery] Guid? companyId,
        CancellationToken cancellationToken)
    {
        var command = new CreateSalesRepresentativeCommand(
            companyId,
            request.FirstName,
            request.LastName,
            request.Username,
            request.Email,
            request.Phone,
            request.Password,
            request.BranchId,
            request.IsActive);

        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing sales representative's profile and branch assignment.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(typeof(SalesRepresentativeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSalesRepresentative(
        Guid id,
        [FromBody] UpdateSalesRepresentativeRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateSalesRepresentativeCommand(
            id,
            request.FirstName,
            request.LastName,
            request.Phone,
            request.Email,
            request.BranchId,
            request.IsActive);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Activate or deactivate a sales representative account.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleSalesRepresentativeStatus(
        Guid id,
        [FromBody] bool isActive,
        CancellationToken cancellationToken)
    {
        var command = new ToggleSalesRepresentativeStatusCommand(id, isActive);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Reset the password of a sales representative.
    /// </summary>
    [HttpPost("{id:guid}/reset-password")]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetSalesRepresentativePassword(
        Guid id,
        [FromBody] ResetSalesRepPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var command = new ResetSalesRepresentativePasswordCommand(id, request.NewPassword);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get customers currently assigned to a sales representative.
    /// </summary>
    [HttpGet("{id:guid}/customers")]
    [Authorize(Policy = "SalesTeam.View")]
    [ProducesResponseType(typeof(IReadOnlyList<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssignedCustomers(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetSalesRepAssignedCustomersQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Assign or replace customers mapped to a sales representative.
    /// </summary>
    [HttpPut("{id:guid}/customers")]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignCustomers(
        Guid id,
        [FromBody] AssignCustomersToSalesRepRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AssignCustomersToSalesRepCommand(id, request.CustomerIds ?? new List<Guid>());
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get enrolled login location for a sales representative.
    /// </summary>
    [HttpGet("{id:guid}/location")]
    [Authorize(Policy = "SalesTeam.View")]
    [ProducesResponseType(typeof(SalesRepLocationEnrollmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetLocation(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetSalesRepLocationQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        if (result.IsSuccess && result.Value == null)
        {
            return NoContent();
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Register or update enrolled login location for a sales representative.
    /// </summary>
    [HttpPut("{id:guid}/location")]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(typeof(SalesRepLocationEnrollmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterLocation(
        Guid id,
        [FromBody] RegisterSalesRepLocationRequest request,
        CancellationToken cancellationToken)
    {
        var command = new RegisterSalesRepLocationCommand(
            id,
            request.LocationName,
            request.Latitude,
            request.Longitude,
            request.AllowedRadiusMeters);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Remove or deactivate enrolled login location for a sales representative.
    /// </summary>
    [HttpDelete("{id:guid}/location")]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLocation(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteSalesRepLocationCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Get biometric face and location enrollment status for a sales representative.
    /// </summary>
    [HttpGet("{id:guid}/biometric-status")]
    [Authorize(Policy = "SalesTeam.View")]
    [ProducesResponseType(typeof(SalesRepBiometricStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBiometricStatus(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetSalesRepBiometricStatusQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Enroll face biometric template for a sales representative via Base64 JSON payload.
    /// </summary>
    [HttpPost("{id:guid}/face/enroll")]
    [HttpPost("{id:guid}/face/re-enroll")]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EnrollFace(
        Guid id,
        [FromBody] EnrollSalesRepFaceBase64Request request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ImageBase64))
        {
            return BadRequest(new ProblemDetails { Title = "Invalid Image", Detail = "No valid base64 image data provided." });
        }

        byte[] imageBytes = ParseImageData(request.ImageBase64);
        if (imageBytes.Length == 0)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid Image", Detail = "Could not parse image byte array." });
        }

        var command = new EnrollSalesRepFaceCommand(id, imageBytes, request.AlgorithmVersion ?? "v1.0");
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Remove / deactivate facial biometric template for a sales representative.
    /// </summary>
    [HttpDelete("{id:guid}/face")]
    [Authorize(Policy = "SalesTeam.Manage")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFace(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteSalesRepFaceCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    private static byte[] ParseImageData(string base64Payload)
    {
        try
        {
            var data = base64Payload.Contains(',') ? base64Payload.Substring(base64Payload.IndexOf(',') + 1) : base64Payload;
            return Convert.FromBase64String(data);
        }
        catch
        {
            return Array.Empty<byte>();
        }
    }
}


using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.Inventory.Transactions.Commands;
using INK.ERP.Application.Features.Inventory.Transactions.DTOs;
using INK.ERP.Application.Features.Inventory.Transactions.Queries;

namespace INK.ERP.API.Controllers.Inventory;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/inventory/transactions")]
public class InventoryTransactionsController : BaseApiController
{
    /// <summary>
    /// Posts a new immutable inventory stock transaction and atomically updates the inventory balance.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(InventoryTransactionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostTransaction([FromBody] PostInventoryTransactionCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a paged list of inventory transactions with optional filters.
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryTransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] Guid? companyId,
        [FromQuery] Guid? inventoryLocationId,
        [FromQuery] Guid? productId,
        [FromQuery] string? transactionType,
        [FromQuery] string? referenceDocumentType,
        [FromQuery] string? referenceDocumentNumber,
        [FromQuery] Guid? performedByEmployeeId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetInventoryTransactionsPagedQuery(
            companyId,
            inventoryLocationId,
            productId,
            transactionType,
            referenceDocumentType,
            referenceDocumentNumber,
            performedByEmployeeId,
            fromDate,
            toDate,
            search,
            page,
            pageSize);

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves a single inventory transaction by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryTransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransactionById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetInventoryTransactionByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves the latest transaction for a given balance context.
    /// </summary>
    [HttpGet("latest")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryTransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLatestTransaction(
        [FromQuery] Guid companyId,
        [FromQuery] Guid inventoryLocationId,
        [FromQuery] Guid productId,
        CancellationToken cancellationToken)
    {
        var query = new GetLatestInventoryTransactionQuery(companyId, inventoryLocationId, productId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves all transactions associated with a reference document.
    /// </summary>
    [HttpGet("reference/{referenceDocumentType}/{referenceDocumentId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryTransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactionsByReference(
        string referenceDocumentType,
        Guid referenceDocumentId,
        [FromQuery] Guid? companyId,
        CancellationToken cancellationToken)
    {
        var query = new GetInventoryTransactionsByReferenceQuery(companyId, referenceDocumentType, referenceDocumentId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Diagnostic reconciliation tool: compares current balance on hand against ledger transaction sum.
    /// </summary>
    [HttpGet("reconcile")]
    [Authorize]
    [ProducesResponseType(typeof(InventoryReconciliationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Reconcile(
        [FromQuery] Guid companyId,
        [FromQuery] Guid inventoryLocationId,
        [FromQuery] Guid productId,
        CancellationToken cancellationToken)
    {
        var query = new ReconcileInventoryLedgerQuery(companyId, inventoryLocationId, productId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }
}

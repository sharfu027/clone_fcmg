using System;

namespace INK.ERP.Application.Features.Inventory.Transactions.DTOs;

public record InventoryTransactionDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    Guid InventoryLocationId,
    string? InventoryLocationName,
    string? InventoryLocationCode,
    Guid ProductId,
    string? ProductName,
    string? ProductCode,
    string? Sku,
    Guid BaseUomId,
    string? BaseUomName,
    string TransactionType,
    decimal Quantity,
    decimal SignedQuantity,
    decimal BalanceAfter,
    string? ReferenceDocumentType,
    Guid? ReferenceDocumentId,
    string? ReferenceDocumentNumber,
    string? BatchNumber,
    DateTime? ExpiryDate,
    Guid? PerformedByEmployeeId,
    string? PerformedByEmployeeName,
    string? Notes,
    DateTime CreatedAtUtc);

public record InventoryReconciliationDto(
    Guid CompanyId,
    string? CompanyName,
    Guid InventoryLocationId,
    string? InventoryLocationName,
    Guid ProductId,
    string? ProductName,
    string? BaseUomName,
    decimal CurrentOnHandQuantity,
    decimal LedgerCalculatedQuantity,
    decimal Discrepancy,
    bool IsReconciled,
    int TotalTransactionsCount);

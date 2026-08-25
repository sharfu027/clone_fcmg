using System;
using System.Collections.Generic;

namespace INK.ERP.Application.Features.Inventory.Transfers.DTOs;

public record StockTransferLineDto(
    Guid Id,
    Guid StockTransferId,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? ProductSku,
    string UomName,
    decimal RequestedQuantity,
    decimal ApprovedQuantity,
    decimal DispatchedQuantity,
    decimal ReceivedQuantity,
    decimal RemainingQuantity,
    DateTime CreatedAtUtc
);

public record StockTransferDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    string TransferNumber,
    Guid SourceLocationId,
    string SourceLocationName,
    string SourceLocationCode,
    Guid DestinationLocationId,
    string DestinationLocationName,
    string DestinationLocationCode,
    Guid? SalesOrderId,
    string? SalesOrderNumber,
    string Status,
    Guid RequestedByEmployeeId,
    string RequestedByEmployeeName,
    Guid? ApprovedByEmployeeId,
    string? ApprovedByEmployeeName,
    DateTime? DispatchedAtUtc,
    DateTime? ReceivedAtUtc,
    string? Notes,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc,
    IReadOnlyList<StockTransferLineDto> Lines
);

public record CreateStockTransferLineRequest(
    Guid ProductId,
    decimal RequestedQuantity
);

public record CreateStockTransferRequest(
    Guid CompanyId,
    Guid SourceLocationId,
    Guid DestinationLocationId,
    Guid? SalesOrderId,
    Guid RequestedByEmployeeId,
    string? Notes,
    List<CreateStockTransferLineRequest> Lines
);

public record ApproveTransferLineItem(
    Guid LineId,
    decimal ApprovedQuantity
);

public record ApproveStockTransferRequest(
    Guid ApprovedByEmployeeId,
    List<ApproveTransferLineItem>? LineApprovals = null
);

public record ReceiveTransferLineItem(
    Guid LineId,
    decimal ReceivedQuantity
);

public record ReceiveStockTransferRequest(
    List<ReceiveTransferLineItem>? LineReceipts = null
);

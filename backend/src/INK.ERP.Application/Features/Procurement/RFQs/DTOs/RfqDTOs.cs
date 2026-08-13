using System;
using System.Collections.Generic;

namespace INK.ERP.Application.Features.Procurement.RFQs.DTOs;

public record RfqItemDto(
    Guid Id,
    Guid RfqId,
    Guid ProductId,
    string ProductCode,
    string ProductName,
    string Uom,
    decimal RequestedQuantity,
    DateTime? RequiredByDate,
    string? Notes);

public record RfqSupplierDto(
    Guid Id,
    Guid RfqId,
    Guid SupplierId,
    string SupplierCode,
    string SupplierName,
    string? ContactPerson,
    string? Email,
    string? Phone,
    string DeliveryStatus,
    DateTime? SentAtUtc);

public record RfqDto(
    Guid Id,
    Guid CompanyId,
    string RfqNumber,
    Guid PurchaseRequisitionId,
    string PurchaseRequisitionNumber,
    DateTime RfqDate,
    DateTime ResponseDueDate,
    Guid? DepartmentId,
    string? DepartmentName,
    string RequestedByUserId,
    string RequestedByName,
    string? BuyerUserId,
    string? BuyerName,
    string CurrencyCode,
    string Status,
    string? Notes,
    string? CancelReason,
    string? CloseReason,
    DateTime? SubmittedAtUtc,
    DateTime? SentAtUtc,
    DateTime? ClosedAtUtc,
    DateTime? CancelledAtUtc,
    DateTime CreatedAtUtc,
    string? CreatedBy,
    DateTime? LastModifiedAtUtc,
    string? LastModifiedBy,
    IReadOnlyList<RfqItemDto> Items,
    IReadOnlyList<RfqSupplierDto> Suppliers);

public record CreateRfqItemRequest(
    Guid ProductId,
    decimal RequestedQuantity,
    DateTime? RequiredByDate,
    string? Notes);

public record CreateRfqSupplierRequest(
    Guid SupplierId);

public record RfqMetricsDto(
    int TotalRfqsCount,
    int DraftRfqsCount,
    int SubmittedRfqsCount,
    int SentRfqsCount,
    int ClosedRfqsCount,
    int CancelledRfqsCount);

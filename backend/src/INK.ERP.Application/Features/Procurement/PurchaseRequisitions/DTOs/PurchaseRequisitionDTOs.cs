using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.Application.Features.Procurement.PurchaseRequisitions.DTOs;

public record PurchaseRequisitionItemDto(
    Guid Id,
    Guid PurchaseRequisitionId,
    Guid ProductId,
    string ProductCode,
    string ProductName,
    string Uom,
    decimal RequestedQuantity,
    decimal EstimatedUnitPrice,
    decimal EstimatedLineTotal,
    string? Notes);

public record PurchaseRequisitionStatusHistoryDto(
    Guid Id,
    Guid PurchaseRequisitionId,
    string FromStatus,
    string ToStatus,
    string ChangedByUserId,
    string ChangedByName,
    string? Comment,
    DateTime TimestampUtc);

public record PurchaseRequisitionDto(
    Guid Id,
    Guid CompanyId,
    string RequisitionNumber,
    string RequestedByUserId,
    string RequestedByName,
    Guid? DepartmentId,
    string? DepartmentName,
    Guid? WarehouseId,
    string? WarehouseName,
    DateTime RequestDate,
    DateTime RequiredByDate,
    string Priority,
    string Status,
    string Purpose,
    string? Notes,
    decimal EstimatedTotalAmount,
    string CurrencyCode,
    DateTime? SubmittedAtUtc,
    DateTime? ApprovedAtUtc,
    DateTime? RejectedAtUtc,
    DateTime? CancelledAtUtc,
    DateTime CreatedAtUtc,
    string? CreatedBy,
    DateTime? LastModifiedAtUtc,
    string? LastModifiedBy,
    IReadOnlyList<PurchaseRequisitionItemDto> Items,
    IReadOnlyList<PurchaseRequisitionStatusHistoryDto> StatusHistories);

public record CreatePurchaseRequisitionItemRequest(
    Guid ProductId,
    decimal RequestedQuantity,
    decimal EstimatedUnitPrice,
    string? Notes);

public record ProcurementMetricsDto(
    int OpenRequisitionsCount,
    int PendingApprovalsCount,
    int ApprovedRequisitionsCount,
    int RejectedRequisitionsCount,
    decimal EstimatedPRValue);

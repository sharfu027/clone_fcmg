using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Procurement.PurchaseRequisitions.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.Application.Features.Procurement.PurchaseRequisitions.Queries;

public record GetPurchaseRequisitionsPagedQuery(
    Guid CompanyId,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    RequisitionStatus? Status = null,
    RequisitionPriority? Priority = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<Result<PagedResult<PurchaseRequisitionDto>>>;

public class GetPurchaseRequisitionsPagedQueryHandler : IRequestHandler<GetPurchaseRequisitionsPagedQuery, Result<PagedResult<PurchaseRequisitionDto>>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;

    public GetPurchaseRequisitionsPagedQueryHandler(IPurchaseRequisitionRepository requisitionRepository)
    {
        _requisitionRepository = requisitionRepository;
    }

    public async Task<Result<PagedResult<PurchaseRequisitionDto>>> Handle(GetPurchaseRequisitionsPagedQuery request, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _requisitionRepository.GetPagedAsync(
            request.CompanyId,
            request.Page,
            request.PageSize,
            request.Search,
            request.Status,
            request.Priority,
            request.FromDate,
            request.ToDate,
            cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        var pagedResult = new PagedResult<PurchaseRequisitionDto>(dtos, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<PurchaseRequisitionDto>>.Success(pagedResult);
    }

    private static PurchaseRequisitionDto MapToDto(PurchaseRequisition pr)
    {
        return new PurchaseRequisitionDto(
            pr.Id,
            pr.CompanyId,
            pr.RequisitionNumber,
            pr.RequestedByUserId,
            pr.RequestedByName,
            pr.DepartmentId,
            pr.DepartmentName,
            pr.WarehouseId,
            pr.WarehouseName,
            pr.RequestDate,
            pr.RequiredByDate,
            pr.Priority.ToString(),
            pr.Status.ToString(),
            pr.Purpose,
            pr.Notes,
            pr.EstimatedTotalAmount,
            pr.CurrencyCode,
            pr.SubmittedAtUtc,
            pr.ApprovedAtUtc,
            pr.RejectedAtUtc,
            pr.CancelledAtUtc,
            pr.CreatedAtUtc,
            pr.CreatedBy,
            pr.LastModifiedAtUtc,
            pr.LastModifiedBy,
            pr.Items.Select(i => new PurchaseRequisitionItemDto(
                i.Id, i.PurchaseRequisitionId, i.ProductId, i.ProductCode, i.ProductName, i.Uom, i.RequestedQuantity, i.EstimatedUnitPrice, i.EstimatedLineTotal, i.Notes
            )).ToList(),
            pr.StatusHistories.Select(h => new PurchaseRequisitionStatusHistoryDto(
                h.Id, h.PurchaseRequisitionId, h.FromStatus.ToString(), h.ToStatus.ToString(), h.ChangedByUserId, h.ChangedByName, h.Comment, h.TimestampUtc
            )).OrderBy(h => h.TimestampUtc).ToList()
        );
    }
}

public record GetPurchaseRequisitionByIdQuery(Guid Id) : IRequest<Result<PurchaseRequisitionDto>>;

public class GetPurchaseRequisitionByIdQueryHandler : IRequestHandler<GetPurchaseRequisitionByIdQuery, Result<PurchaseRequisitionDto>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;

    public GetPurchaseRequisitionByIdQueryHandler(IPurchaseRequisitionRepository requisitionRepository)
    {
        _requisitionRepository = requisitionRepository;
    }

    public async Task<Result<PurchaseRequisitionDto>> Handle(GetPurchaseRequisitionByIdQuery request, CancellationToken cancellationToken)
    {
        var pr = await _requisitionRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (pr == null)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("PR.NotFound", $"Purchase Requisition '{request.Id}' was not found."));
        }

        return Result<PurchaseRequisitionDto>.Success(MapToDto(pr));
    }

    private static PurchaseRequisitionDto MapToDto(PurchaseRequisition pr)
    {
        return new PurchaseRequisitionDto(
            pr.Id,
            pr.CompanyId,
            pr.RequisitionNumber,
            pr.RequestedByUserId,
            pr.RequestedByName,
            pr.DepartmentId,
            pr.DepartmentName,
            pr.WarehouseId,
            pr.WarehouseName,
            pr.RequestDate,
            pr.RequiredByDate,
            pr.Priority.ToString(),
            pr.Status.ToString(),
            pr.Purpose,
            pr.Notes,
            pr.EstimatedTotalAmount,
            pr.CurrencyCode,
            pr.SubmittedAtUtc,
            pr.ApprovedAtUtc,
            pr.RejectedAtUtc,
            pr.CancelledAtUtc,
            pr.CreatedAtUtc,
            pr.CreatedBy,
            pr.LastModifiedAtUtc,
            pr.LastModifiedBy,
            pr.Items.Select(i => new PurchaseRequisitionItemDto(
                i.Id, i.PurchaseRequisitionId, i.ProductId, i.ProductCode, i.ProductName, i.Uom, i.RequestedQuantity, i.EstimatedUnitPrice, i.EstimatedLineTotal, i.Notes
            )).ToList(),
            pr.StatusHistories.Select(h => new PurchaseRequisitionStatusHistoryDto(
                h.Id, h.PurchaseRequisitionId, h.FromStatus.ToString(), h.ToStatus.ToString(), h.ChangedByUserId, h.ChangedByName, h.Comment, h.TimestampUtc
            )).OrderBy(h => h.TimestampUtc).ToList()
        );
    }
}

public record GetNextRequisitionNumberQuery(Guid CompanyId) : IRequest<Result<string>>;

public class GetNextRequisitionNumberQueryHandler : IRequestHandler<GetNextRequisitionNumberQuery, Result<string>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;

    public GetNextRequisitionNumberQueryHandler(IPurchaseRequisitionRepository requisitionRepository)
    {
        _requisitionRepository = requisitionRepository;
    }

    public async Task<Result<string>> Handle(GetNextRequisitionNumberQuery request, CancellationToken cancellationToken)
    {
        var number = await _requisitionRepository.GenerateNextRequisitionNumberAsync(request.CompanyId, cancellationToken);
        return Result<string>.Success(number);
    }
}

public record GetProcurementDashboardMetricsQuery(Guid CompanyId) : IRequest<Result<ProcurementMetricsDto>>;

public class GetProcurementDashboardMetricsQueryHandler : IRequestHandler<GetProcurementDashboardMetricsQuery, Result<ProcurementMetricsDto>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;

    public GetProcurementDashboardMetricsQueryHandler(IPurchaseRequisitionRepository requisitionRepository)
    {
        _requisitionRepository = requisitionRepository;
    }

    public async Task<Result<ProcurementMetricsDto>> Handle(GetProcurementDashboardMetricsQuery request, CancellationToken cancellationToken)
    {
        var (allPrs, totalCount) = await _requisitionRepository.GetPagedAsync(
            request.CompanyId, 1, 10000, null, null, null, null, null, cancellationToken);

        int openCount = allPrs.Count(r => r.Status == RequisitionStatus.Draft || r.Status == RequisitionStatus.PendingApproval);
        int pendingCount = allPrs.Count(r => r.Status == RequisitionStatus.PendingApproval);
        int approvedCount = allPrs.Count(r => r.Status == RequisitionStatus.Approved);
        int rejectedCount = allPrs.Count(r => r.Status == RequisitionStatus.Rejected);
        decimal estimatedTotalValue = allPrs.Where(r => r.Status != RequisitionStatus.Cancelled).Sum(r => r.EstimatedTotalAmount);

        var dto = new ProcurementMetricsDto(
            OpenRequisitionsCount: openCount,
            PendingApprovalsCount: pendingCount,
            ApprovedRequisitionsCount: approvedCount,
            RejectedRequisitionsCount: rejectedCount,
            EstimatedPRValue: estimatedTotalValue
        );

        return Result<ProcurementMetricsDto>.Success(dto);
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Procurement.RFQs.Commands;
using INK.ERP.Application.Features.Procurement.RFQs.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.Application.Features.Procurement.RFQs.Queries;

public record GetRfqsPagedQuery(
    Guid CompanyId,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    RfqStatus? Status = null,
    Guid? SupplierId = null,
    Guid? PurchaseRequisitionId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<Result<PagedResult<RfqDto>>>;

public class GetRfqsPagedQueryHandler : IRequestHandler<GetRfqsPagedQuery, Result<PagedResult<RfqDto>>>
{
    private readonly IRfqRepository _rfqRepository;

    public GetRfqsPagedQueryHandler(IRfqRepository rfqRepository)
    {
        _rfqRepository = rfqRepository;
    }

    public async Task<Result<PagedResult<RfqDto>>> Handle(GetRfqsPagedQuery request, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _rfqRepository.GetPagedAsync(
            request.CompanyId,
            request.Page,
            request.PageSize,
            request.Search,
            request.Status,
            request.SupplierId,
            request.PurchaseRequisitionId,
            request.FromDate,
            request.ToDate,
            cancellationToken);

        var dtos = items.Select(RfqMappingHelper.MapToDto).ToList();
        var pagedResult = new PagedResult<RfqDto>(dtos, totalCount, request.Page, request.PageSize);

        return Result<PagedResult<RfqDto>>.Success(pagedResult);
    }
}

public record GetRfqByIdQuery(Guid Id) : IRequest<Result<RfqDto>>;

public class GetRfqByIdQueryHandler : IRequestHandler<GetRfqByIdQuery, Result<RfqDto>>
{
    private readonly IRfqRepository _rfqRepository;

    public GetRfqByIdQueryHandler(IRfqRepository rfqRepository)
    {
        _rfqRepository = rfqRepository;
    }

    public async Task<Result<RfqDto>> Handle(GetRfqByIdQuery request, CancellationToken cancellationToken)
    {
        var rfq = await _rfqRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rfq == null)
        {
            return Result<RfqDto>.Failure(Error.NotFound("RFQ.NotFound", $"RFQ '{request.Id}' was not found."));
        }

        return Result<RfqDto>.Success(RfqMappingHelper.MapToDto(rfq));
    }
}

public record GetRfqsByPurchaseRequisitionQuery(Guid PurchaseRequisitionId) : IRequest<Result<IReadOnlyList<RfqDto>>>;

public class GetRfqsByPurchaseRequisitionQueryHandler : IRequestHandler<GetRfqsByPurchaseRequisitionQuery, Result<IReadOnlyList<RfqDto>>>
{
    private readonly IRfqRepository _rfqRepository;

    public GetRfqsByPurchaseRequisitionQueryHandler(IRfqRepository rfqRepository)
    {
        _rfqRepository = rfqRepository;
    }

    public async Task<Result<IReadOnlyList<RfqDto>>> Handle(GetRfqsByPurchaseRequisitionQuery request, CancellationToken cancellationToken)
    {
        var rfqs = await _rfqRepository.GetByPurchaseRequisitionIdAsync(request.PurchaseRequisitionId, cancellationToken);
        IReadOnlyList<RfqDto> dtos = rfqs.Select(RfqMappingHelper.MapToDto).ToList();

        return Result<IReadOnlyList<RfqDto>>.Success(dtos);
    }
}

public record GetRfqMetricsQuery(Guid CompanyId) : IRequest<Result<RfqMetricsDto>>;

public class GetRfqMetricsQueryHandler : IRequestHandler<GetRfqMetricsQuery, Result<RfqMetricsDto>>
{
    private readonly IRfqRepository _rfqRepository;

    public GetRfqMetricsQueryHandler(IRfqRepository rfqRepository)
    {
        _rfqRepository = rfqRepository;
    }

    public async Task<Result<RfqMetricsDto>> Handle(GetRfqMetricsQuery request, CancellationToken cancellationToken)
    {
        var (total, draft, submitted, sent, closed, cancelled) = await _rfqRepository.GetRfqMetricsAsync(request.CompanyId, cancellationToken);

        var dto = new RfqMetricsDto(total, draft, submitted, sent, closed, cancelled);
        return Result<RfqMetricsDto>.Success(dto);
    }
}

public record GetNextRfqNumberQuery(Guid CompanyId) : IRequest<Result<string>>;

public class GetNextRfqNumberQueryHandler : IRequestHandler<GetNextRfqNumberQuery, Result<string>>
{
    private readonly IRfqRepository _rfqRepository;

    public GetNextRfqNumberQueryHandler(IRfqRepository rfqRepository)
    {
        _rfqRepository = rfqRepository;
    }

    public async Task<Result<string>> Handle(GetNextRfqNumberQuery request, CancellationToken cancellationToken)
    {
        var nextNumber = await _rfqRepository.GenerateNextRfqNumberAsync(request.CompanyId, cancellationToken);
        return Result<string>.Success(nextNumber);
    }
}

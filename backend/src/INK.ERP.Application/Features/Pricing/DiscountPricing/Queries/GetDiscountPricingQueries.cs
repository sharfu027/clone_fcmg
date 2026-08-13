using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Pricing.DiscountPricing.DTOs;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.DiscountPricing.Queries;

public record GetDiscountRulesQuery(
    Guid? CompanyId,
    DiscountScope? Scope,
    DiscountMethod? Method,
    DiscountRuleStatus? Status,
    DateTime? EffectiveDate,
    string? Search,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<Result<PagedResult<DiscountRuleDto>>>;

public class GetDiscountRulesQueryHandler : IRequestHandler<GetDiscountRulesQuery, Result<PagedResult<DiscountRuleDto>>>
{
    private readonly IDiscountRuleRepository _repository;

    public GetDiscountRulesQueryHandler(IDiscountRuleRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<PagedResult<DiscountRuleDto>>> Handle(GetDiscountRulesQuery request, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _repository.GetPagedAsync(
            request.CompanyId,
            request.Scope,
            request.Method,
            request.Status,
            request.EffectiveDate,
            request.Search,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        var paged = new PagedResult<DiscountRuleDto>(dtos, totalCount, request.PageNumber, request.PageSize);

        return Result<PagedResult<DiscountRuleDto>>.Success(paged);
    }

    private static DiscountRuleDto MapToDto(DiscountRule r) => new(
        r.Id, r.CompanyId, r.RuleCode, r.RuleName, r.Description,
        r.DiscountMethod, r.DiscountValue, r.Scope,
        r.CustomerId, r.Customer?.Code, r.Customer != null ? (r.Customer.TradeName ?? r.Customer.LegalName) : null,
        r.ProductId, r.Product?.Code, r.Product?.Name,
        r.CategoryId, null,
        r.PriceListId, r.PriceList?.Name,
        r.MinimumQuantity, r.MaximumQuantity, r.MaximumDiscountAmount,
        r.EffectiveFrom, r.EffectiveTo, r.Priority,
        r.Status, r.IsActive,
        r.CreatedAtUtc, r.CreatedBy, r.LastModifiedAtUtc, r.LastModifiedBy,
        r.ActivatedBy, r.ActivatedAtUtc, r.DeactivatedBy, r.DeactivatedAtUtc, r.ArchivedBy, r.ArchivedAtUtc
    );
}

public record GetDiscountRuleByIdQuery(Guid Id) : IRequest<Result<DiscountRuleDto>>;

public class GetDiscountRuleByIdQueryHandler : IRequestHandler<GetDiscountRuleByIdQuery, Result<DiscountRuleDto>>
{
    private readonly IDiscountRuleRepository _repository;

    public GetDiscountRuleByIdQueryHandler(IDiscountRuleRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<DiscountRuleDto>> Handle(GetDiscountRuleByIdQuery request, CancellationToken cancellationToken)
    {
        var rule = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rule == null) return Result<DiscountRuleDto>.Failure(Error.NotFound("DiscountRule.NotFound", "Discount rule not found."));

        return Result<DiscountRuleDto>.Success(MapToDto(rule));
    }

    private static DiscountRuleDto MapToDto(DiscountRule r) => new(
        r.Id, r.CompanyId, r.RuleCode, r.RuleName, r.Description,
        r.DiscountMethod, r.DiscountValue, r.Scope,
        r.CustomerId, r.Customer?.Code, r.Customer != null ? (r.Customer.TradeName ?? r.Customer.LegalName) : null,
        r.ProductId, r.Product?.Code, r.Product?.Name,
        r.CategoryId, null,
        r.PriceListId, r.PriceList?.Name,
        r.MinimumQuantity, r.MaximumQuantity, r.MaximumDiscountAmount,
        r.EffectiveFrom, r.EffectiveTo, r.Priority,
        r.Status, r.IsActive,
        r.CreatedAtUtc, r.CreatedBy, r.LastModifiedAtUtc, r.LastModifiedBy,
        r.ActivatedBy, r.ActivatedAtUtc, r.DeactivatedBy, r.DeactivatedAtUtc, r.ArchivedBy, r.ArchivedAtUtc
    );
}

public record CalculateDiscountQuery(
    Guid CompanyId,
    Guid? CustomerId,
    Guid? ProductId,
    Guid? CategoryId,
    Guid? PriceListId,
    decimal Quantity,
    decimal ResolvedUnitPrice,
    DateTime? EffectiveDate
) : IRequest<Result<DiscountCalculationResult>>;

public class CalculateDiscountQueryHandler : IRequestHandler<CalculateDiscountQuery, Result<DiscountCalculationResult>>
{
    private readonly IDiscountCalculationService _calculationService;

    public CalculateDiscountQueryHandler(IDiscountCalculationService calculationService)
    {
        _calculationService = calculationService;
    }

    public async Task<Result<DiscountCalculationResult>> Handle(CalculateDiscountQuery request, CancellationToken cancellationToken)
    {
        var req = new DiscountCalculationRequest(
            request.CompanyId,
            request.CustomerId,
            request.ProductId,
            request.CategoryId,
            request.PriceListId,
            request.Quantity,
            request.ResolvedUnitPrice,
            request.EffectiveDate
        );

        var result = await _calculationService.CalculateDiscountAsync(req, cancellationToken);
        return Result<DiscountCalculationResult>.Success(result);
    }
}

public record GetDiscountRuleHistoryQuery(Guid Id) : IRequest<Result<IReadOnlyList<DiscountRuleHistoryDto>>>;

public class GetDiscountRuleHistoryQueryHandler : IRequestHandler<GetDiscountRuleHistoryQuery, Result<IReadOnlyList<DiscountRuleHistoryDto>>>
{
    private readonly IDiscountRuleRepository _repository;

    public GetDiscountRuleHistoryQueryHandler(IDiscountRuleRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<IReadOnlyList<DiscountRuleHistoryDto>>> Handle(GetDiscountRuleHistoryQuery request, CancellationToken cancellationToken)
    {
        var rule = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rule == null) return Result<IReadOnlyList<DiscountRuleHistoryDto>>.Failure(Error.NotFound("DiscountRule.NotFound", "Discount rule not found."));

        var history = new List<DiscountRuleHistoryDto>
        {
            new(rule.Id, "Created", rule.CreatedBy ?? "System Admin", rule.CreatedAtUtc, $"Created rule {rule.RuleCode} ({rule.RuleName}) in {rule.Status} state.")
        };

        if (rule.LastModifiedAtUtc.HasValue)
        {
            history.Add(new(rule.Id, "Updated", rule.LastModifiedBy ?? "System Admin", rule.LastModifiedAtUtc.Value, "Updated discount rule parameters."));
        }

        if (rule.ActivatedAtUtc.HasValue)
        {
            history.Add(new(rule.Id, "Activated", rule.ActivatedBy ?? "System Admin", rule.ActivatedAtUtc.Value, "Activated rule for production sales calculation."));
        }

        if (rule.DeactivatedAtUtc.HasValue)
        {
            history.Add(new(rule.Id, "Deactivated", rule.DeactivatedBy ?? "System Admin", rule.DeactivatedAtUtc.Value, "Deactivated rule."));
        }

        if (rule.ArchivedAtUtc.HasValue)
        {
            history.Add(new(rule.Id, "Archived", rule.ArchivedBy ?? "System Admin", rule.ArchivedAtUtc.Value, "Archived discount rule."));
        }

        IReadOnlyList<DiscountRuleHistoryDto> resultList = history.OrderByDescending(h => h.TimestampUtc).ToList();
        return Result<IReadOnlyList<DiscountRuleHistoryDto>>.Success(resultList);
    }
}

using System;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.DiscountPricing.DTOs;

public record DiscountRuleDto(
    Guid Id,
    Guid CompanyId,
    string RuleCode,
    string RuleName,
    string? Description,
    DiscountMethod DiscountMethod,
    decimal DiscountValue,
    DiscountScope Scope,
    Guid? CustomerId,
    string? CustomerCode,
    string? CustomerName,
    Guid? ProductId,
    string? ProductCode,
    string? ProductName,
    Guid? CategoryId,
    string? CategoryName,
    Guid? PriceListId,
    string? PriceListName,
    int? MinimumQuantity,
    int? MaximumQuantity,
    decimal? MaximumDiscountAmount,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    int Priority,
    DiscountRuleStatus Status,
    bool IsActive,
    DateTime CreatedAtUtc,
    string? CreatedBy,
    DateTime? LastModifiedAtUtc,
    string? LastModifiedBy,
    string? ActivatedBy,
    DateTime? ActivatedAtUtc,
    string? DeactivatedBy,
    DateTime? DeactivatedAtUtc,
    string? ArchivedBy,
    DateTime? ArchivedAtUtc
);

public record CreateDiscountRuleDto(
    Guid CompanyId,
    string? RuleCode,
    string RuleName,
    string? Description,
    DiscountMethod DiscountMethod,
    decimal DiscountValue,
    DiscountScope Scope,
    Guid? CustomerId,
    Guid? ProductId,
    Guid? CategoryId,
    Guid? PriceListId,
    int? MinimumQuantity,
    int? MaximumQuantity,
    decimal? MaximumDiscountAmount,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    int Priority,
    DiscountRuleStatus Status
);

public record UpdateDiscountRuleDto(
    string RuleName,
    string? Description,
    DiscountMethod DiscountMethod,
    decimal DiscountValue,
    DiscountScope Scope,
    Guid? CustomerId,
    Guid? ProductId,
    Guid? CategoryId,
    Guid? PriceListId,
    int? MinimumQuantity,
    int? MaximumQuantity,
    decimal? MaximumDiscountAmount,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    int Priority,
    DiscountRuleStatus Status
);

public record DiscountRuleHistoryDto(
    Guid RuleId,
    string Action,
    string ActionBy,
    DateTime TimestampUtc,
    string Details
);

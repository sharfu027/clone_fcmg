using System;
using System.Threading;
using System.Threading.Tasks;

namespace INK.ERP.Application.Common.Interfaces;

public record DiscountCalculationRequest(
    Guid CompanyId,
    Guid? CustomerId,
    Guid? ProductId,
    Guid? CategoryId,
    Guid? PriceListId,
    decimal Quantity,
    decimal ResolvedUnitPrice,
    DateTime? EffectiveDate
);

public record DiscountCalculationResult(
    decimal OriginalUnitPrice,
    decimal DiscountAmount,
    decimal DiscountPercentage,
    decimal TotalBeforeDiscount,
    decimal TotalDiscount,
    decimal FinalUnitPrice,
    decimal FinalTotal,
    Guid? AppliedRuleId,
    string? AppliedRuleCode,
    string? AppliedRuleName,
    int? AppliedRulePriority,
    string? AppliedRuleScope
);

public interface IDiscountCalculationService
{
    Task<DiscountCalculationResult> CalculateDiscountAsync(
        DiscountCalculationRequest request,
        CancellationToken cancellationToken = default);
}

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Infrastructure.Services;

public class DiscountCalculationService : IDiscountCalculationService
{
    private readonly IDiscountRuleRepository _repository;

    public DiscountCalculationService(IDiscountRuleRepository repository)
    {
        _repository = repository;
    }

    public async Task<DiscountCalculationResult> CalculateDiscountAsync(
        DiscountCalculationRequest request,
        CancellationToken cancellationToken = default)
    {
        decimal quantity = request.Quantity > 0 ? request.Quantity : 1m;
        decimal resolvedUnitPrice = request.ResolvedUnitPrice >= 0 ? request.ResolvedUnitPrice : 0m;
        DateTime targetDate = request.EffectiveDate ?? DateTime.UtcNow;

        var activeRules = await _repository.GetApplicableActiveRulesAsync(request.CompanyId, targetDate, cancellationToken);

        // Filter by quantity limits
        var quantityValidRules = activeRules.Where(r =>
            (!r.MinimumQuantity.HasValue || quantity >= r.MinimumQuantity.Value) &&
            (!r.MaximumQuantity.HasValue || quantity <= r.MaximumQuantity.Value)
        ).ToList();

        // Match scope
        DiscountRule? winningRule = null;

        // 1. Customer + Product
        if (request.CustomerId.HasValue && request.ProductId.HasValue)
        {
            winningRule = quantityValidRules.FirstOrDefault(r =>
                r.Scope == DiscountScope.CustomerProduct &&
                r.CustomerId == request.CustomerId.Value &&
                r.ProductId == request.ProductId.Value);
        }

        // 2. Customer
        if (winningRule == null && request.CustomerId.HasValue)
        {
            winningRule = quantityValidRules.FirstOrDefault(r =>
                r.Scope == DiscountScope.Customer &&
                r.CustomerId == request.CustomerId.Value);
        }

        // 3. Product
        if (winningRule == null && request.ProductId.HasValue)
        {
            winningRule = quantityValidRules.FirstOrDefault(r =>
                r.Scope == DiscountScope.Product &&
                r.ProductId == request.ProductId.Value);
        }

        // 4. Category
        if (winningRule == null && request.CategoryId.HasValue)
        {
            winningRule = quantityValidRules.FirstOrDefault(r =>
                r.Scope == DiscountScope.Category &&
                r.CategoryId == request.CategoryId.Value);
        }

        // 5. Price List
        if (winningRule == null && request.PriceListId.HasValue)
        {
            winningRule = quantityValidRules.FirstOrDefault(r =>
                r.Scope == DiscountScope.PriceList &&
                r.PriceListId == request.PriceListId.Value);
        }

        // 6. Global
        if (winningRule == null)
        {
            winningRule = quantityValidRules.FirstOrDefault(r => r.Scope == DiscountScope.Global);
        }

        if (winningRule == null)
        {
            decimal origTotal = Math.Round(quantity * resolvedUnitPrice, 2);
            return new DiscountCalculationResult(
                OriginalUnitPrice: resolvedUnitPrice,
                DiscountAmount: 0m,
                DiscountPercentage: 0m,
                TotalBeforeDiscount: origTotal,
                TotalDiscount: 0m,
                FinalUnitPrice: resolvedUnitPrice,
                FinalTotal: origTotal,
                AppliedRuleId: null,
                AppliedRuleCode: null,
                AppliedRuleName: null,
                AppliedRulePriority: null,
                AppliedRuleScope: null
            );
        }

        // Calculate discount unit value
        decimal rawDiscount = 0m;
        if (winningRule.DiscountMethod == DiscountMethod.Percentage)
        {
            decimal pct = Math.Clamp(winningRule.DiscountValue, 0m, 100m);
            rawDiscount = resolvedUnitPrice * (pct / 100m);
        }
        else if (winningRule.DiscountMethod == DiscountMethod.FixedAmount)
        {
            rawDiscount = Math.Max(0m, winningRule.DiscountValue);
        }

        // Cap by MaximumDiscountAmount if specified
        if (winningRule.MaximumDiscountAmount.HasValue && rawDiscount > winningRule.MaximumDiscountAmount.Value)
        {
            rawDiscount = winningRule.MaximumDiscountAmount.Value;
        }

        // Never exceed resolved unit price
        if (rawDiscount > resolvedUnitPrice)
        {
            rawDiscount = resolvedUnitPrice;
        }

        decimal discountAmount = Math.Round(rawDiscount, 2);
        decimal discountPercentage = resolvedUnitPrice > 0
            ? Math.Round((discountAmount / resolvedUnitPrice) * 100m, 2)
            : 0m;

        decimal totalBeforeDiscount = Math.Round(quantity * resolvedUnitPrice, 2);
        decimal totalDiscount = Math.Round(quantity * discountAmount, 2);
        decimal finalUnitPrice = Math.Round(resolvedUnitPrice - discountAmount, 2);
        decimal finalTotal = Math.Round(quantity * finalUnitPrice, 2);

        return new DiscountCalculationResult(
            OriginalUnitPrice: resolvedUnitPrice,
            DiscountAmount: discountAmount,
            DiscountPercentage: discountPercentage,
            TotalBeforeDiscount: totalBeforeDiscount,
            TotalDiscount: totalDiscount,
            FinalUnitPrice: finalUnitPrice,
            FinalTotal: finalTotal,
            AppliedRuleId: winningRule.Id,
            AppliedRuleCode: winningRule.RuleCode,
            AppliedRuleName: winningRule.RuleName,
            AppliedRulePriority: winningRule.Priority,
            AppliedRuleScope: winningRule.Scope.ToString()
        );
    }
}

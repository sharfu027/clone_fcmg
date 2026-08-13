using FluentValidation;
using INK.ERP.Application.Features.Pricing.PriceLists.Commands;
using INK.ERP.Application.Features.Pricing.PriceLists.DTOs;

namespace INK.ERP.Application.Features.Pricing.PriceLists.Validators;

public class UpdatePriceListCommandValidator : AbstractValidator<UpdatePriceListCommand>
{
    public UpdatePriceListCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Price List ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Price List Name is required.")
            .MaximumLength(150).WithMessage("Price List Name cannot exceed 150 characters.");

        RuleFor(x => x.EffectiveFrom)
            .NotEmpty().WithMessage("EffectiveFrom date is required.");

        RuleFor(x => x.EffectiveTo)
            .GreaterThan(x => x.EffectiveFrom)
            .When(x => x.EffectiveTo.HasValue)
            .WithMessage("EffectiveTo date must be strictly after EffectiveFrom date.");

        RuleFor(x => x.ConcurrencyToken)
            .NotEmpty().WithMessage("ConcurrencyToken is required.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one PriceListItem is required.")
            .Must(items => items != null && items.Count > 0).WithMessage("At least one PriceListItem is required.")
            .Must(HaveUniqueProducts).WithMessage("Duplicate ProductId found within the Price List items.");

        RuleForEach(x => x.Items).SetValidator(new PriceListItemDtoValidator());
    }

    private static bool HaveUniqueProducts(List<PriceListItemDto>? items)
    {
        if (items == null || items.Count == 0) return true;
        return items.Select(i => i.ProductId).Distinct().Count() == items.Count;
    }
}

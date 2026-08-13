using FluentValidation;
using INK.ERP.Application.Features.Pricing.PriceLists.DTOs;

namespace INK.ERP.Application.Features.Pricing.PriceLists.Validators;

public class PriceListItemDtoValidator : AbstractValidator<PriceListItemDto>
{
    public PriceListItemDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(x => x.BasePrice)
            .GreaterThan(0).WithMessage("BasePrice must be greater than 0.");

        RuleFor(x => x.Msrp)
            .GreaterThanOrEqualTo(x => x.BasePrice)
            .WithMessage("MSRP must be greater than or equal to BasePrice.");

        RuleFor(x => x.MinSellingPrice)
            .LessThanOrEqualTo(x => x.BasePrice)
            .WithMessage("MinimumSellingPrice must be less than or equal to BasePrice.");
    }
}

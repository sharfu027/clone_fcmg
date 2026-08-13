using FluentValidation;
using INK.ERP.Application.Features.Pricing.PriceLists.Commands;

namespace INK.ERP.Application.Features.Pricing.PriceLists.Validators;

public class PublishPriceListCommandValidator : AbstractValidator<PublishPriceListCommand>
{
    public PublishPriceListCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Price List ID is required.");

        RuleFor(x => x.ConcurrencyToken)
            .NotEmpty().WithMessage("ConcurrencyToken is required.");
    }
}

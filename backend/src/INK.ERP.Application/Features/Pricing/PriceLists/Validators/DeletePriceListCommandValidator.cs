using FluentValidation;
using INK.ERP.Application.Features.Pricing.PriceLists.Commands;

namespace INK.ERP.Application.Features.Pricing.PriceLists.Validators;

public class DeletePriceListCommandValidator : AbstractValidator<DeletePriceListCommand>
{
    public DeletePriceListCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Price List ID is required.");
    }
}

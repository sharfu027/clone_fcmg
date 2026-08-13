using FluentValidation;
using INK.ERP.Application.Features.MasterData.Brands.Commands;

namespace INK.ERP.Application.Features.MasterData.Brands.Validators;

public class CreateBrandCommandValidator : AbstractValidator<CreateBrandCommand>
{
    public CreateBrandCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Brand Code is required.")
            .MaximumLength(20).WithMessage("Brand Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Brand Name is required.")
            .MaximumLength(100).WithMessage("Brand Name cannot exceed 100 characters.");
    }
}

public class UpdateBrandCommandValidator : AbstractValidator<UpdateBrandCommand>
{
    public UpdateBrandCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Brand ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Brand Code is required.")
            .MaximumLength(20).WithMessage("Brand Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Brand Name is required.")
            .MaximumLength(100).WithMessage("Brand Name cannot exceed 100 characters.");
    }
}

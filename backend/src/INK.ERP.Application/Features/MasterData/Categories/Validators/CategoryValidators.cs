using FluentValidation;
using INK.ERP.Application.Features.MasterData.Categories.Commands;

namespace INK.ERP.Application.Features.MasterData.Categories.Validators;

public class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Category Code is required.")
            .MaximumLength(20).WithMessage("Category Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category Name is required.")
            .MaximumLength(100).WithMessage("Category Name cannot exceed 100 characters.");

        RuleFor(x => x.GstTaxRatePercent)
            .InclusiveBetween(0.00m, 28.00m).WithMessage("GST Tax Rate must be between 0% and 28%.");

        RuleFor(x => x.HsnCodeDefault)
            .NotEmpty().WithMessage("HSN Code is required.")
            .MaximumLength(10).WithMessage("HSN Code cannot exceed 10 characters.");
    }
}

public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Category ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Category Code is required.")
            .MaximumLength(20).WithMessage("Category Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category Name is required.")
            .MaximumLength(100).WithMessage("Category Name cannot exceed 100 characters.");

        RuleFor(x => x.GstTaxRatePercent)
            .InclusiveBetween(0.00m, 28.00m).WithMessage("GST Tax Rate must be between 0% and 28%.");

        RuleFor(x => x.HsnCodeDefault)
            .NotEmpty().WithMessage("HSN Code is required.")
            .MaximumLength(10).WithMessage("HSN Code cannot exceed 10 characters.");
    }
}

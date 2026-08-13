using FluentValidation;
using INK.ERP.Application.Features.MasterData.UnitsOfMeasure.Commands;

namespace INK.ERP.Application.Features.MasterData.UnitsOfMeasure.Validators;

public class CreateUnitOfMeasureCommandValidator : AbstractValidator<CreateUnitOfMeasureCommand>
{
    public CreateUnitOfMeasureCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("UOM Code is required.")
            .MaximumLength(15).WithMessage("UOM Code cannot exceed 15 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("UOM Name is required.")
            .MaximumLength(50).WithMessage("UOM Name cannot exceed 50 characters.");

        RuleFor(x => x.BaseUnitCode)
            .NotEmpty().WithMessage("Base Unit Code is required.")
            .MaximumLength(15).WithMessage("Base Unit Code cannot exceed 15 characters.");

        RuleFor(x => x.ConversionFactor)
            .GreaterThan(0).WithMessage("Conversion Factor must be greater than 0.");
    }
}

public class UpdateUnitOfMeasureCommandValidator : AbstractValidator<UpdateUnitOfMeasureCommand>
{
    public UpdateUnitOfMeasureCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("UOM ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("UOM Code is required.")
            .MaximumLength(15).WithMessage("UOM Code cannot exceed 15 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("UOM Name is required.")
            .MaximumLength(50).WithMessage("UOM Name cannot exceed 50 characters.");

        RuleFor(x => x.BaseUnitCode)
            .NotEmpty().WithMessage("Base Unit Code is required.")
            .MaximumLength(15).WithMessage("Base Unit Code cannot exceed 15 characters.");

        RuleFor(x => x.ConversionFactor)
            .GreaterThan(0).WithMessage("Conversion Factor must be greater than 0.");
    }
}

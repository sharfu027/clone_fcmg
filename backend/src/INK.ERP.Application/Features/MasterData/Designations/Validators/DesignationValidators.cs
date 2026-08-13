using FluentValidation;
using INK.ERP.Application.Features.MasterData.Designations.Commands;

namespace INK.ERP.Application.Features.MasterData.Designations.Validators;

public class CreateDesignationCommandValidator : AbstractValidator<CreateDesignationCommand>
{
    public CreateDesignationCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Designation Code is required.")
            .MaximumLength(20).WithMessage("Designation Code cannot exceed 20 characters.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Designation Title is required.")
            .MaximumLength(100).WithMessage("Designation Title cannot exceed 100 characters.");

        RuleFor(x => x.Level)
            .InclusiveBetween(1, 20).WithMessage("Designation Level must be between 1 and 20.");
    }
}

public class UpdateDesignationCommandValidator : AbstractValidator<UpdateDesignationCommand>
{
    public UpdateDesignationCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Designation ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Designation Code is required.")
            .MaximumLength(20).WithMessage("Designation Code cannot exceed 20 characters.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Designation Title is required.")
            .MaximumLength(100).WithMessage("Designation Title cannot exceed 100 characters.");

        RuleFor(x => x.Level)
            .InclusiveBetween(1, 20).WithMessage("Designation Level must be between 1 and 20.");
    }
}

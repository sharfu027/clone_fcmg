using FluentValidation;
using INK.ERP.Application.Features.MasterData.Departments.Commands;

namespace INK.ERP.Application.Features.MasterData.Departments.Validators;

public class CreateDepartmentCommandValidator : AbstractValidator<CreateDepartmentCommand>
{
    public CreateDepartmentCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Department Code is required.")
            .MaximumLength(20).WithMessage("Department Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Department Name is required.")
            .MaximumLength(100).WithMessage("Department Name cannot exceed 100 characters.");
    }
}

public class UpdateDepartmentCommandValidator : AbstractValidator<UpdateDepartmentCommand>
{
    public UpdateDepartmentCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Department ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Department Code is required.")
            .MaximumLength(20).WithMessage("Department Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Department Name is required.")
            .MaximumLength(100).WithMessage("Department Name cannot exceed 100 characters.");
    }
}

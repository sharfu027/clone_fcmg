using FluentValidation;
using INK.ERP.Application.Features.MasterData.EmployeeRoles.Commands;

namespace INK.ERP.Application.Features.MasterData.EmployeeRoles.Validators;

public class CreateEmployeeRoleCommandValidator : AbstractValidator<CreateEmployeeRoleCommand>
{
    public CreateEmployeeRoleCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Employee Role Code is required.")
            .MaximumLength(30).WithMessage("Employee Role Code cannot exceed 30 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Employee Role Name is required.")
            .MaximumLength(100).WithMessage("Employee Role Name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(255).WithMessage("Description cannot exceed 255 characters.");
    }
}

public class UpdateEmployeeRoleCommandValidator : AbstractValidator<UpdateEmployeeRoleCommand>
{
    public UpdateEmployeeRoleCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Employee Role ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Employee Role Code is required.")
            .MaximumLength(30).WithMessage("Employee Role Code cannot exceed 30 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Employee Role Name is required.")
            .MaximumLength(100).WithMessage("Employee Role Name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(255).WithMessage("Description cannot exceed 255 characters.");
    }
}

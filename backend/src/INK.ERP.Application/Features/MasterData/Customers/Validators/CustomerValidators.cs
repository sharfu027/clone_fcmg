using FluentValidation;
using INK.ERP.Application.Features.MasterData.Customers.Commands;

namespace INK.ERP.Application.Features.MasterData.Customers.Validators;

public class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Customer Code is required.")
            .MaximumLength(20).WithMessage("Customer Code cannot exceed 20 characters.");

        RuleFor(x => x.LegalName)
            .NotEmpty().WithMessage("Legal Name is required.")
            .MaximumLength(150).WithMessage("Legal Name cannot exceed 150 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address format.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.");
    }
}

public class UpdateCustomerCommandValidator : AbstractValidator<UpdateCustomerCommand>
{
    public UpdateCustomerCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Customer ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Customer Code is required.")
            .MaximumLength(20).WithMessage("Customer Code cannot exceed 20 characters.");

        RuleFor(x => x.LegalName)
            .NotEmpty().WithMessage("Legal Name is required.")
            .MaximumLength(150).WithMessage("Legal Name cannot exceed 150 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address format.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.");
    }
}

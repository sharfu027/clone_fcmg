using FluentValidation;
using INK.ERP.Application.Features.MasterData.Suppliers.Commands;

namespace INK.ERP.Application.Features.MasterData.Suppliers.Validators;

public class CreateSupplierCommandValidator : AbstractValidator<CreateSupplierCommand>
{
    public CreateSupplierCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Supplier Code is required.")
            .MaximumLength(20).WithMessage("Supplier Code cannot exceed 20 characters.");

        RuleFor(x => x.LegalName)
            .NotEmpty().WithMessage("Legal Name is required.")
            .MaximumLength(150).WithMessage("Legal Name cannot exceed 150 characters.");

        RuleFor(x => x.Gstin)
            .NotEmpty().WithMessage("GSTIN is required.")
            .Length(15).WithMessage("GSTIN must be exactly 15 characters.");

        RuleFor(x => x.Pan)
            .NotEmpty().WithMessage("PAN is required.")
            .Length(10).WithMessage("PAN must be exactly 10 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address format.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.");
    }
}

public class UpdateSupplierCommandValidator : AbstractValidator<UpdateSupplierCommand>
{
    public UpdateSupplierCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Supplier ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Supplier Code is required.")
            .MaximumLength(20).WithMessage("Supplier Code cannot exceed 20 characters.");

        RuleFor(x => x.LegalName)
            .NotEmpty().WithMessage("Legal Name is required.")
            .MaximumLength(150).WithMessage("Legal Name cannot exceed 150 characters.");

        RuleFor(x => x.Gstin)
            .NotEmpty().WithMessage("GSTIN is required.")
            .Length(15).WithMessage("GSTIN must be exactly 15 characters.");

        RuleFor(x => x.Pan)
            .NotEmpty().WithMessage("PAN is required.")
            .Length(10).WithMessage("PAN must be exactly 10 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address format.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.");
    }
}

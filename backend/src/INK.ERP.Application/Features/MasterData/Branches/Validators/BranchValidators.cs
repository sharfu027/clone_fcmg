using FluentValidation;
using INK.ERP.Application.Features.MasterData.Branches.Commands;

namespace INK.ERP.Application.Features.MasterData.Branches.Validators;

public class CreateBranchCommandValidator : AbstractValidator<CreateBranchCommand>
{
    public CreateBranchCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Branch Code is required.")
            .MaximumLength(20).WithMessage("Branch Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Branch Name is required.")
            .MaximumLength(100).WithMessage("Branch Name cannot exceed 100 characters.");

        RuleFor(x => x.Gstin)
            .NotEmpty().WithMessage("GSTIN is required.")
            .MaximumLength(30).WithMessage("GSTIN cannot exceed 30 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone is required.");
    }
}

public class UpdateBranchCommandValidator : AbstractValidator<UpdateBranchCommand>
{
    public UpdateBranchCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Branch ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Branch Code is required.")
            .MaximumLength(20).WithMessage("Branch Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Branch Name is required.")
            .MaximumLength(100).WithMessage("Branch Name cannot exceed 100 characters.");

        RuleFor(x => x.Gstin)
            .NotEmpty().WithMessage("GSTIN is required.")
            .MaximumLength(30).WithMessage("GSTIN cannot exceed 30 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone is required.");
    }
}

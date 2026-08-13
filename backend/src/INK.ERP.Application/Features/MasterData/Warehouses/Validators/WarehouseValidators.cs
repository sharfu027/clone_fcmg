using FluentValidation;
using INK.ERP.Application.Features.MasterData.Warehouses.Commands;

namespace INK.ERP.Application.Features.MasterData.Warehouses.Validators;

public class CreateWarehouseCommandValidator : AbstractValidator<CreateWarehouseCommand>
{
    public CreateWarehouseCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("Branch ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Warehouse Code is required.")
            .MaximumLength(20).WithMessage("Warehouse Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Warehouse Name is required.")
            .MaximumLength(100).WithMessage("Warehouse Name cannot exceed 100 characters.");
    }
}

public class UpdateWarehouseCommandValidator : AbstractValidator<UpdateWarehouseCommand>
{
    public UpdateWarehouseCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Warehouse ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("Branch ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Warehouse Code is required.")
            .MaximumLength(20).WithMessage("Warehouse Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Warehouse Name is required.")
            .MaximumLength(100).WithMessage("Warehouse Name cannot exceed 100 characters.");
    }
}

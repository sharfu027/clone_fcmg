using FluentValidation;
using INK.ERP.Application.Features.MasterData.Products.Commands;

namespace INK.ERP.Application.Features.MasterData.Products.Validators;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required.");

        RuleFor(x => x.BaseUomId)
            .NotEmpty().WithMessage("Base UOM ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Product Code is required.")
            .MaximumLength(30).WithMessage("Product Code cannot exceed 30 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product Name is required.")
            .MaximumLength(150).WithMessage("Product Name cannot exceed 150 characters.");

        RuleFor(x => x.Sku)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(30).WithMessage("SKU cannot exceed 30 characters.");

        RuleFor(x => x.Mrp)
            .GreaterThanOrEqualTo(0).WithMessage("MRP cannot be negative.");

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage("Base Price cannot be negative.");
    }
}

public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required.");

        RuleFor(x => x.BaseUomId)
            .NotEmpty().WithMessage("Base UOM ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Product Code is required.")
            .MaximumLength(30).WithMessage("Product Code cannot exceed 30 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product Name is required.")
            .MaximumLength(150).WithMessage("Product Name cannot exceed 150 characters.");

        RuleFor(x => x.Sku)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(30).WithMessage("SKU cannot exceed 30 characters.");

        RuleFor(x => x.Mrp)
            .GreaterThanOrEqualTo(0).WithMessage("MRP cannot be negative.");

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage("Base Price cannot be negative.");
    }
}

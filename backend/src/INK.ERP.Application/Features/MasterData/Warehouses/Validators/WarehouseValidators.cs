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
            .NotEmpty().WithMessage("Branch Link is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Warehouse Code is required.")
            .MaximumLength(20).WithMessage("Warehouse Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Warehouse Name is required.")
            .MaximumLength(100).WithMessage("Warehouse Name cannot exceed 100 characters.");

        RuleFor(x => x.WarehouseType)
            .NotEmpty().WithMessage("Warehouse Type is required.")
            .MaximumLength(50).WithMessage("Warehouse Type cannot exceed 50 characters.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.")
            .MaximumLength(30).WithMessage("Status cannot exceed 30 characters.");

        RuleFor(x => x.AddressLine1)
            .NotEmpty().WithMessage("Address Line 1 is required.")
            .MaximumLength(150).WithMessage("Address Line 1 cannot exceed 150 characters.");

        RuleFor(x => x.AddressLine2)
            .MaximumLength(150).WithMessage("Address Line 2 cannot exceed 150 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(50).WithMessage("City cannot exceed 50 characters.");

        RuleFor(x => x.State)
            .NotEmpty().WithMessage("State is required.")
            .MaximumLength(50).WithMessage("State cannot exceed 50 characters.");

        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Pincode is required.")
            .MaximumLength(15).WithMessage("Pincode cannot exceed 15 characters.");

        RuleFor(x => x.Country)
            .NotEmpty().WithMessage("Country is required.")
            .MaximumLength(50).WithMessage("Country cannot exceed 50 characters.");

        RuleFor(x => x.CapacitySqFt)
            .GreaterThanOrEqualTo(0).When(x => x.CapacitySqFt.HasValue).WithMessage("Storage Area cannot be negative.");

        RuleFor(x => x.PalletCapacity)
            .GreaterThanOrEqualTo(0).When(x => x.PalletCapacity.HasValue).WithMessage("Pallet Capacity cannot be negative.");

        RuleFor(x => x.CartonCapacity)
            .GreaterThanOrEqualTo(0).When(x => x.CartonCapacity.HasValue).WithMessage("Carton Capacity cannot be negative.");

        RuleFor(x => x.ContactNumber)
            .MaximumLength(30).When(x => !string.IsNullOrEmpty(x.ContactNumber)).WithMessage("Contact Number cannot exceed 30 characters.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email address is not in a valid format.")
            .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email cannot exceed 100 characters.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).When(x => x.Latitude.HasValue).WithMessage("Latitude must be between -90 and 90 degrees.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).When(x => x.Longitude.HasValue).WithMessage("Longitude must be between -180 and 180 degrees.");

        RuleFor(x => x.Remarks)
            .MaximumLength(500).WithMessage("Remarks cannot exceed 500 characters.");
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
            .NotEmpty().WithMessage("Branch Link is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Warehouse Code is required.")
            .MaximumLength(20).WithMessage("Warehouse Code cannot exceed 20 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Warehouse Name is required.")
            .MaximumLength(100).WithMessage("Warehouse Name cannot exceed 100 characters.");

        RuleFor(x => x.WarehouseType)
            .NotEmpty().WithMessage("Warehouse Type is required.")
            .MaximumLength(50).WithMessage("Warehouse Type cannot exceed 50 characters.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.")
            .MaximumLength(30).WithMessage("Status cannot exceed 30 characters.");

        RuleFor(x => x.AddressLine1)
            .NotEmpty().WithMessage("Address Line 1 is required.")
            .MaximumLength(150).WithMessage("Address Line 1 cannot exceed 150 characters.");

        RuleFor(x => x.AddressLine2)
            .MaximumLength(150).WithMessage("Address Line 2 cannot exceed 150 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(50).WithMessage("City cannot exceed 50 characters.");

        RuleFor(x => x.State)
            .NotEmpty().WithMessage("State is required.")
            .MaximumLength(50).WithMessage("State cannot exceed 50 characters.");

        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Pincode is required.")
            .MaximumLength(15).WithMessage("Pincode cannot exceed 15 characters.");

        RuleFor(x => x.Country)
            .NotEmpty().WithMessage("Country is required.")
            .MaximumLength(50).WithMessage("Country cannot exceed 50 characters.");

        RuleFor(x => x.CapacitySqFt)
            .GreaterThanOrEqualTo(0).When(x => x.CapacitySqFt.HasValue).WithMessage("Storage Area cannot be negative.");

        RuleFor(x => x.PalletCapacity)
            .GreaterThanOrEqualTo(0).When(x => x.PalletCapacity.HasValue).WithMessage("Pallet Capacity cannot be negative.");

        RuleFor(x => x.CartonCapacity)
            .GreaterThanOrEqualTo(0).When(x => x.CartonCapacity.HasValue).WithMessage("Carton Capacity cannot be negative.");

        RuleFor(x => x.ContactNumber)
            .MaximumLength(30).When(x => !string.IsNullOrEmpty(x.ContactNumber)).WithMessage("Contact Number cannot exceed 30 characters.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email address is not in a valid format.")
            .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email cannot exceed 100 characters.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).When(x => x.Latitude.HasValue).WithMessage("Latitude must be between -90 and 90 degrees.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).When(x => x.Longitude.HasValue).WithMessage("Longitude must be between -180 and 180 degrees.");

        RuleFor(x => x.Remarks)
            .MaximumLength(500).WithMessage("Remarks cannot exceed 500 characters.");
    }
}

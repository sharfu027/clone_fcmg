using System.Text.RegularExpressions;
using FluentValidation;
using INK.ERP.Application.Features.MasterData.Companies.Commands;

namespace INK.ERP.Application.Features.MasterData.Companies.Validators;

public class CreateCompanyCommandValidator : AbstractValidator<CreateCompanyCommand>
{
    public CreateCompanyCommandValidator()
    {
        RuleFor(x => x.Code)
            .MaximumLength(20).WithMessage("Company Code must not exceed 20 characters.")
            .Matches(@"^[A-Za-z0-9\-_]+$").When(x => !string.IsNullOrWhiteSpace(x.Code))
            .WithMessage("Company Code can only contain letters, numbers, hyphens, and underscores.");

        RuleFor(x => x.LegalName)
            .NotEmpty().WithMessage("Legal Name is required.")
            .MaximumLength(150).WithMessage("Legal Name must not exceed 150 characters.");

        RuleFor(x => x.TaxRegistrationNumber)
            .NotEmpty().WithMessage("Tax Registration Number (GSTIN) is required.")
            .Length(15).WithMessage("GSTIN must be exactly 15 characters.")
            .Matches(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
            .WithMessage("Invalid GSTIN format (e.g. 07AAAAA0000A1Z5).");

        RuleFor(x => x.PanNumber)
            .NotEmpty().WithMessage("PAN Number is required.")
            .Length(10).WithMessage("PAN Number must be exactly 10 characters.")
            .Matches(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
            .WithMessage("Invalid PAN format (e.g. AAAAA0000A).");

        When(x => !string.IsNullOrWhiteSpace(x.CinNumber), () =>
        {
            RuleFor(x => x.CinNumber)
                .Length(21).WithMessage("CIN Number must be exactly 21 characters.")
                .Matches(@"^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$")
                .WithMessage("Invalid Corporate Identity Number (CIN) format.");
        });

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email address is required.")
            .EmailAddress().WithMessage("Invalid Email address format.")
            .MaximumLength(100);

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .MaximumLength(20);

        RuleFor(x => x.CurrencyCode)
            .NotEmpty().WithMessage("Currency Code is required.")
            .Length(3).WithMessage("Currency Code must be a 3-letter ISO code.");

        RuleFor(x => x.AddressLine1).NotEmpty().WithMessage("Address Line 1 is required.").MaximumLength(150);
        RuleFor(x => x.City).NotEmpty().WithMessage("City is required.").MaximumLength(50);
        RuleFor(x => x.State).NotEmpty().WithMessage("State is required.").MaximumLength(50);
        RuleFor(x => x.PostalCode).NotEmpty().WithMessage("Postal Code is required.").MaximumLength(15);
        RuleFor(x => x.Country).NotEmpty().WithMessage("Country is required.").MaximumLength(50);
    }
}

public class UpdateCompanyCommandValidator : AbstractValidator<UpdateCompanyCommand>
{
    public UpdateCompanyCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Company ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Company Code is required.")
            .MaximumLength(20)
            .Matches(@"^[A-Za-z0-9\-_]+$");

        RuleFor(x => x.LegalName)
            .NotEmpty().WithMessage("Legal Name is required.")
            .MaximumLength(150);

        RuleFor(x => x.TaxRegistrationNumber)
            .NotEmpty().WithMessage("Tax Registration Number (GSTIN) is required.")
            .Length(15)
            .Matches(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");

        RuleFor(x => x.PanNumber)
            .NotEmpty().WithMessage("PAN Number is required.")
            .Length(10)
            .Matches(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email address is required.")
            .EmailAddress();

        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.CurrencyCode).NotEmpty().Length(3);
        RuleFor(x => x.AddressLine1).NotEmpty().MaximumLength(150);
        RuleFor(x => x.City).NotEmpty().MaximumLength(50);
        RuleFor(x => x.State).NotEmpty().MaximumLength(50);
        RuleFor(x => x.PostalCode).NotEmpty().MaximumLength(15);
        RuleFor(x => x.Country).NotEmpty().MaximumLength(50);
    }
}

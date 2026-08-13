using FluentValidation;

namespace INK.ERP.Application.Features.Security.Incidents.Validators;

public sealed class RaiseSecurityIncidentCommandValidator : AbstractValidator<RaiseSecurityIncidentCommand>
{
    public RaiseSecurityIncidentCommandValidator()
    {
        RuleFor(x => x.Description).NotEmpty().WithMessage("Incident description is required.");
    }
}

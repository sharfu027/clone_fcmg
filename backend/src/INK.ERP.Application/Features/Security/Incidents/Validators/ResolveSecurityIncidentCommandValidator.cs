using FluentValidation;

namespace INK.ERP.Application.Features.Security.Incidents.Validators;

public sealed class ResolveSecurityIncidentCommandValidator : AbstractValidator<ResolveSecurityIncidentCommand>
{
    public ResolveSecurityIncidentCommandValidator()
    {
        RuleFor(x => x.IncidentId).NotEmpty();
        RuleFor(x => x.ResolutionNotes).NotEmpty().WithMessage("Resolution notes are required.");
    }
}

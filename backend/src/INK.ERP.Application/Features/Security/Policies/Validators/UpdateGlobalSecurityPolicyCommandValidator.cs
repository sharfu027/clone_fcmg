using FluentValidation;

namespace INK.ERP.Application.Features.Security.Policies.Validators;

public sealed class UpdateGlobalSecurityPolicyCommandValidator : AbstractValidator<UpdateGlobalSecurityPolicyCommand>
{
    public UpdateGlobalSecurityPolicyCommandValidator()
    {
        RuleFor(x => x.PolicyId).NotEmpty();
        RuleFor(x => x.MinFaceConfidenceScore).InclusiveBetween(0.0f, 1.0f);
        RuleFor(x => x.MaxAllowedGpsRadiusMeters).GreaterThanOrEqualTo(0.0);
        RuleFor(x => x.PasswordMinLength).GreaterThanOrEqualTo(6);
    }
}

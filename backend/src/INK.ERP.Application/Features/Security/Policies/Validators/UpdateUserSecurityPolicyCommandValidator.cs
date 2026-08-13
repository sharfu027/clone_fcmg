using FluentValidation;

namespace INK.ERP.Application.Features.Security.Policies.Validators;

public sealed class UpdateUserSecurityPolicyCommandValidator : AbstractValidator<UpdateUserSecurityPolicyCommand>
{
    public UpdateUserSecurityPolicyCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        When(x => x.MaxAllowedGpsRadiusMetersOverride.HasValue, () =>
        {
            RuleFor(x => x.MaxAllowedGpsRadiusMetersOverride!.Value).GreaterThanOrEqualTo(0.0);
        });
    }
}

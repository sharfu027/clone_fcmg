using FluentValidation;

namespace INK.ERP.Application.Features.Security.Device.Validators;

public sealed class RevokeDeviceCommandValidator : AbstractValidator<RevokeDeviceCommand>
{
    public RevokeDeviceCommandValidator()
    {
        RuleFor(x => x.DeviceId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().WithMessage("Revocation reason is required.");
    }
}

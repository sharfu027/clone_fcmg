using FluentValidation;

namespace INK.ERP.Application.Features.Security.Device.Validators;

public sealed class TrustDeviceCommandValidator : AbstractValidator<TrustDeviceCommand>
{
    public TrustDeviceCommandValidator()
    {
        RuleFor(x => x.DeviceId).NotEmpty();
    }
}

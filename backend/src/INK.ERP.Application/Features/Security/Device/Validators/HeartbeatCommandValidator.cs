using FluentValidation;

namespace INK.ERP.Application.Features.Security.Device.Validators;

public sealed class HeartbeatCommandValidator : AbstractValidator<HeartbeatCommand>
{
    public HeartbeatCommandValidator()
    {
        RuleFor(x => x.DeviceId).NotEmpty();
        RuleFor(x => x.IpAddress).NotEmpty().WithMessage("IP Address is required.");
    }
}

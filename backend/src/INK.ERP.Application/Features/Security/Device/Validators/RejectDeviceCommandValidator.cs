using FluentValidation;

namespace INK.ERP.Application.Features.Security.Device.Validators;

public sealed class RejectDeviceCommandValidator : AbstractValidator<RejectDeviceCommand>
{
    public RejectDeviceCommandValidator()
    {
        RuleFor(x => x.DeviceId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().WithMessage("Rejection reason is required.");
    }
}

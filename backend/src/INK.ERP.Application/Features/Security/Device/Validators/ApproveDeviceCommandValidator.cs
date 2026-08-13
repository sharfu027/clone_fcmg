using FluentValidation;

namespace INK.ERP.Application.Features.Security.Device.Validators;

public sealed class ApproveDeviceCommandValidator : AbstractValidator<ApproveDeviceCommand>
{
    public ApproveDeviceCommandValidator()
    {
        RuleFor(x => x.DeviceId).NotEmpty();
        RuleFor(x => x.ApprovedBy).NotEmpty().WithMessage("Approver identification is required.");
    }
}

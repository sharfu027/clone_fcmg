using FluentValidation;

namespace INK.ERP.Application.Features.Security.Face.Validators;

public sealed class EnrollFaceCommandValidator : AbstractValidator<EnrollFaceCommand>
{
    public EnrollFaceCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ImageData).NotEmpty().WithMessage("Face image data is required.");
    }
}

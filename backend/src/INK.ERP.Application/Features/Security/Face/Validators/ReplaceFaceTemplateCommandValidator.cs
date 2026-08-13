using FluentValidation;

namespace INK.ERP.Application.Features.Security.Face.Validators;

public sealed class ReplaceFaceTemplateCommandValidator : AbstractValidator<ReplaceFaceTemplateCommand>
{
    public ReplaceFaceTemplateCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ImageData).NotEmpty().WithMessage("Replacement face image data is required.");
    }
}

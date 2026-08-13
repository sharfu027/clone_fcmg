using FluentValidation;

namespace INK.ERP.Application.Features.Security.Face.Validators;

public sealed class RecordFaceVerificationCommandValidator : AbstractValidator<RecordFaceVerificationCommand>
{
    public RecordFaceVerificationCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.MatchScore).InclusiveBetween(0.0f, 1.0f);
    }
}

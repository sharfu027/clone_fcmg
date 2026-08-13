using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Behaviors;
using ValidationException = INK.ERP.Application.Common.Exceptions.ValidationException;

namespace INK.ERP.UnitTests.Behaviors;

public sealed class ValidationBehaviorTests
{
    public record SampleRequest(string Name) : IRequest<string>;

    [Fact]
    public async Task Handle_NoValidators_CallsNext()
    {
        // Arrange
        var validators = Enumerable.Empty<IValidator<SampleRequest>>();
        var behavior = new ValidationBehavior<SampleRequest, string>(validators);
        var request = new SampleRequest("Test");

        // Act
        var result = await behavior.Handle(request, () => Task.FromResult("Success"), CancellationToken.None);

        // Assert
        result.Should().Be("Success");
    }

    [Fact]
    public async Task Handle_ValidationPasses_CallsNext()
    {
        // Arrange
        var validatorMock = new Mock<IValidator<SampleRequest>>();
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<SampleRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());

        var behavior = new ValidationBehavior<SampleRequest, string>(new[] { validatorMock.Object });
        var request = new SampleRequest("Valid");

        // Act
        var result = await behavior.Handle(request, () => Task.FromResult("Success"), CancellationToken.None);

        // Assert
        result.Should().Be("Success");
    }

    [Fact]
    public async Task Handle_ValidationFails_ThrowsValidationException()
    {
        // Arrange
        var failure = new ValidationFailure("Name", "Name is required.");
        var validatorMock = new Mock<IValidator<SampleRequest>>();
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<SampleRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult(new[] { failure }));

        var behavior = new ValidationBehavior<SampleRequest, string>(new[] { validatorMock.Object });
        var request = new SampleRequest("");

        // Act & Assert
        var act = async () => await behavior.Handle(request, () => Task.FromResult("Success"), CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }
}

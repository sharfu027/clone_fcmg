using FluentAssertions;
using Xunit;
using INK.ERP.Application.Features.IAM.Commands.Users;

namespace INK.ERP.UnitTests.IAM;

public sealed class CreateUserCommandValidatorTests
{
    private readonly CreateUserCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidCommand_ShouldNotHaveErrors()
    {
        var command = new CreateUserCommand(
            "john.doe",
            "john.doe@example.com",
            "+1234567890",
            "John",
            "Doe",
            "John Doe",
            "SecureP@ss123",
            null,
            "en",
            "UTC");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_EmptyUsername_ShouldHaveError()
    {
        var command = new CreateUserCommand(
            "",
            "john.doe@example.com",
            null,
            "John",
            "Doe",
            "John Doe",
            "SecureP@ss123",
            null,
            "en",
            "UTC");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Username");
    }

    [Fact]
    public void Validate_ShortPassword_ShouldHaveError()
    {
        var command = new CreateUserCommand(
            "john.doe",
            "john.doe@example.com",
            null,
            "John",
            "Doe",
            "John Doe",
            "Short1",
            null,
            "en",
            "UTC");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }

    [Fact]
    public void Validate_InvalidEmail_ShouldHaveError()
    {
        var command = new CreateUserCommand(
            "john.doe",
            "invalid-email-format",
            null,
            "John",
            "Doe",
            "John Doe",
            "SecureP@ss123",
            null,
            "en",
            "UTC");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }
}

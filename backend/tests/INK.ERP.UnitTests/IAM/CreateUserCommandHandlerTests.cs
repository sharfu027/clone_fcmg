using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.IAM.Commands.Users;
using INK.ERP.Application.Features.IAM.Services;
using INK.ERP.Domain.Common;

namespace INK.ERP.UnitTests.IAM;

public sealed class CreateUserCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IGenericRepository<ApplicationUser>> _userRepoMock;
    private readonly Mock<IUserDomainService> _userDomainServiceMock;
    private readonly Mock<IPasswordPolicyService> _passwordPolicyServiceMock;
    private readonly Mock<IDateTime> _dateTimeMock;
    private readonly Mock<ILogger<CreateUserCommandHandler>> _loggerMock;
    private readonly CreateUserCommandHandler _handler;

    public CreateUserCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _userRepoMock = new Mock<IGenericRepository<ApplicationUser>>();
        _userDomainServiceMock = new Mock<IUserDomainService>();
        _passwordPolicyServiceMock = new Mock<IPasswordPolicyService>();
        _dateTimeMock = new Mock<IDateTime>();
        _loggerMock = new Mock<ILogger<CreateUserCommandHandler>>();

        _dateTimeMock.Setup(d => d.UtcNow).Returns(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        _passwordPolicyServiceMock.Setup(p => p.ValidatePassword(It.IsAny<string>())).Returns(Result.Success());

        _unitOfWorkMock.Setup(u => u.Repository<ApplicationUser>()).Returns(_userRepoMock.Object);

        _handler = new CreateUserCommandHandler(
            _unitOfWorkMock.Object,
            _userDomainServiceMock.Object,
            _passwordPolicyServiceMock.Object,
            _dateTimeMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccessWithUserId()
    {
        // Arrange
        _userDomainServiceMock
            .Setup(s => s.CanCreateUserAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

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

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();

        _userRepoMock.Verify(r => r.AddAsync(It.Is<ApplicationUser>(u => u.UserName == "john.doe"), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_DuplicateUsername_ReturnsConflictError()
    {
        // Arrange
        _userDomainServiceMock
            .Setup(s => s.CanCreateUserAsync("john.doe", "john.doe@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.User.UsernameAlreadyExists("john.doe")));

        var command = new CreateUserCommand(
            "john.doe",
            "john.doe@example.com",
            null,
            "John",
            "Doe",
            "John Doe",
            "SecureP@ss123",
            null,
            "en",
            "UTC");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.USER.DUPLICATE_USERNAME");
    }

    [Fact]
    public async Task Handle_PasswordPolicyViolation_ReturnsValidationError()
    {
        // Arrange
        _passwordPolicyServiceMock
            .Setup(p => p.ValidatePassword(It.IsAny<string>()))
            .Returns(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.User.PasswordPolicyViolation));

        var command = new CreateUserCommand(
            "john.doe",
            "john.doe@example.com",
            null,
            "John",
            "Doe",
            "John Doe",
            "weak",
            null,
            "en",
            "UTC");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.USER.PASSWORD_POLICY_VIOLATION");
    }
}

using FluentAssertions;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Behaviors;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Security;

namespace INK.ERP.UnitTests.Behaviors;

public sealed class AuthorizationBehaviorTests
{
    [Authorize]
    public record SecuredRequest : MediatR.IRequest<string>;

    [Authorize(Roles = "ADMIN, MANAGER")]
    public record RoleSecuredRequest : MediatR.IRequest<string>;

    public record UnsecuredRequest : MediatR.IRequest<string>;

    private readonly Mock<ICurrentUserService> _currentUserServiceMock;

    public AuthorizationBehaviorTests()
    {
        _currentUserServiceMock = new Mock<ICurrentUserService>();
    }

    [Fact]
    public async Task Handle_UnsecuredRequest_PassesThrough()
    {
        // Arrange
        var behavior = new AuthorizationBehavior<UnsecuredRequest, string>(_currentUserServiceMock.Object);
        var request = new UnsecuredRequest();

        // Act
        var result = await behavior.Handle(request, () => Task.FromResult("Success"), CancellationToken.None);

        // Assert
        result.Should().Be("Success");
    }

    [Fact]
    public async Task Handle_SecuredRequestUnauthenticated_ThrowsUnauthorizedException()
    {
        // Arrange
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(false);
        var behavior = new AuthorizationBehavior<SecuredRequest, string>(_currentUserServiceMock.Object);
        var request = new SecuredRequest();

        // Act & Assert
        var act = async () => await behavior.Handle(request, () => Task.FromResult("Success"), CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>().WithMessage("User is not authenticated.");
    }

    [Fact]
    public async Task Handle_RoleSecuredRequestUserHasRole_CallsNext()
    {
        // Arrange
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.Roles).Returns(new List<string> { "ADMIN" });
        var behavior = new AuthorizationBehavior<RoleSecuredRequest, string>(_currentUserServiceMock.Object);
        var request = new RoleSecuredRequest();

        // Act
        var result = await behavior.Handle(request, () => Task.FromResult("Success"), CancellationToken.None);

        // Assert
        result.Should().Be("Success");
    }

    [Fact]
    public async Task Handle_RoleSecuredRequestUserLacksRole_ThrowsUnauthorizedException()
    {
        // Arrange
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.Roles).Returns(new List<string> { "GUEST" });
        var behavior = new AuthorizationBehavior<RoleSecuredRequest, string>(_currentUserServiceMock.Object);
        var request = new RoleSecuredRequest();

        // Act & Assert
        var act = async () => await behavior.Handle(request, () => Task.FromResult("Success"), CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>().WithMessage("User is not authorized to access this resource.");
    }
}

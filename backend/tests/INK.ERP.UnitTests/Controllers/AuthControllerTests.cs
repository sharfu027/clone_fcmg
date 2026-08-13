using System.Security.Claims;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.IAM.Commands.Auth;
using INK.ERP.Application.Features.IAM.DTOs;
using INK.ERP.Domain.Common;
using Microsoft.Extensions.DependencyInjection;

namespace INK.ERP.UnitTests.Controllers;

public sealed class AuthControllerTests
{
    private readonly Mock<ISender> _mediatorMock;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mediatorMock = new Mock<ISender>();

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new ServiceCollection()
            .AddSingleton(_mediatorMock.Object)
            .BuildServiceProvider();

        _controller = new AuthController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsOkResultWithAuthResponse()
    {
        // Arrange
        var userDto = new UserDto(Guid.NewGuid(), "admin", "admin@example.com", null, "Admin", "User", "Admin User", null, true, false, false, null, false, true, false, "en", "UTC", null, DateTime.UtcNow, null, new List<string> { "ADMIN" });
        var authResponse = new AuthResponseDto("access_token", "refresh_token", DateTime.UtcNow.AddHours(1), userDto);

        _mediatorMock.Setup(m => m.Send(It.IsAny<LoginCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(authResponse));

        var request = new LoginRequest("admin", "AdminPassword123!");

        // Act
        var result = await _controller.Login(request, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        dto.AccessToken.Should().Be("access_token");
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsProblemDetails401()
    {
        // Arrange
        _mediatorMock.Setup(m => m.Send(It.IsAny<LoginCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<AuthResponseDto>(new Error("IAM.USER.INVALID_CREDENTIALS", "Invalid username or password.", ErrorType.Unauthorized)));

        var request = new LoginRequest("admin", "WrongPassword");

        // Act
        var result = await _controller.Login(request, CancellationToken.None);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(401);
        var problemDetails = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
        problemDetails.Detail.Should().Be("Invalid username or password.");
    }
}

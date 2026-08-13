using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using INK.ERP.API.Controllers;
using INK.ERP.Application.Features.IAM.Commands.Users;
using INK.ERP.Application.Features.IAM.DTOs;
using INK.ERP.Application.Features.IAM.Queries.Users;
using INK.ERP.Domain.Common;
using Microsoft.Extensions.DependencyInjection;

namespace INK.ERP.UnitTests.Controllers;

public sealed class UsersControllerTests
{
    private readonly Mock<ISender> _mediatorMock;
    private readonly UsersController _controller;

    public UsersControllerTests()
    {
        _mediatorMock = new Mock<ISender>();

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new ServiceCollection()
            .AddSingleton(_mediatorMock.Object)
            .BuildServiceProvider();

        _controller = new UsersController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };
    }

    [Fact]
    public async Task GetUserById_UserExists_ReturnsOkResultWithUserDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var userDto = new UserDto(userId, "john.doe", "john@example.com", null, "John", "Doe", "John Doe", null, true, false, false, null, false, true, false, "en", "UTC", null, DateTime.UtcNow, null, new List<string> { "USER" });

        _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByIdQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(userDto));

        // Act
        var result = await _controller.GetUserById(userId, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = okResult.Value.Should().BeOfType<UserDto>().Subject;
        dto.Id.Should().Be(userId);
    }

    [Fact]
    public async Task GetUserById_UserNotFound_ReturnsProblemDetails404()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByIdQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<UserDto>(INK.ERP.Application.Features.IAM.IamErrors.User.NotFound(userId)));

        // Act
        var result = await _controller.GetUserById(userId, CancellationToken.None);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(404);
        var problemDetails = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
        problemDetails.Detail.Should().Contain(userId.ToString());
    }

    [Fact]
    public async Task CreateUser_ValidCommand_Returns201Created()
    {
        // Arrange
        var newUserId = Guid.NewGuid();
        var command = new CreateUserCommand("john.doe", "john@example.com", null, "John", "Doe", "John Doe", "SecureP@ss123", null, "en", "UTC");

        _mediatorMock.Setup(m => m.Send(command, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(newUserId));

        // Act
        var result = await _controller.CreateUser(command, CancellationToken.None);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(201);
        objectResult.Value.Should().Be(newUserId);
    }

    [Fact]
    public async Task CreateUser_DuplicateUsername_ReturnsProblemDetails409Conflict()
    {
        // Arrange
        var command = new CreateUserCommand("john.doe", "john@example.com", null, "John", "Doe", "John Doe", "SecureP@ss123", null, "en", "UTC");

        _mediatorMock.Setup(m => m.Send(command, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<Guid>(INK.ERP.Application.Features.IAM.IamErrors.User.UsernameAlreadyExists("john.doe")));

        // Act
        var result = await _controller.CreateUser(command, CancellationToken.None);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(409);
        var problemDetails = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
        problemDetails.Detail.Should().Contain("john.doe");
    }
}

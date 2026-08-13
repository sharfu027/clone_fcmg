using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.IAM.Commands.Users;
using INK.ERP.Application.Features.IAM.Services;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.UnitTests.IAM;

public sealed class AssignRoleCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IGenericRepository<ApplicationUser>> _userRepoMock;
    private readonly Mock<IGenericRepository<ApplicationRole>> _roleRepoMock;
    private readonly Mock<IGenericRepository<UserRole>> _userRoleRepoMock;
    private readonly Mock<IUserDomainService> _userDomainServiceMock;
    private readonly Mock<IDateTime> _dateTimeMock;
    private readonly Mock<ILogger<AssignRoleCommandHandler>> _loggerMock;
    private readonly AssignRoleCommandHandler _handler;

    public AssignRoleCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _userRepoMock = new Mock<IGenericRepository<ApplicationUser>>();
        _roleRepoMock = new Mock<IGenericRepository<ApplicationRole>>();
        _userRoleRepoMock = new Mock<IGenericRepository<UserRole>>();
        _userDomainServiceMock = new Mock<IUserDomainService>();
        _dateTimeMock = new Mock<IDateTime>();
        _loggerMock = new Mock<ILogger<AssignRoleCommandHandler>>();

        _dateTimeMock.Setup(d => d.UtcNow).Returns(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));

        _unitOfWorkMock.Setup(u => u.Repository<ApplicationUser>()).Returns(_userRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<ApplicationRole>()).Returns(_roleRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<UserRole>()).Returns(_userRoleRepoMock.Object);

        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(c => c.Roles).Returns(new List<string> { "Super Administrator" });
        var mockSessionRevocationService = new Mock<ISessionRevocationService>();

        _handler = new AssignRoleCommandHandler(
            _unitOfWorkMock.Object,
            _userDomainServiceMock.Object,
            mockCurrentUserService.Object,
            mockSessionRevocationService.Object,
            _dateTimeMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        var user = new ApplicationUser { Id = userId, IsActive = true };
        var role = new ApplicationRole { Id = roleId, Name = "Manager", Code = "MANAGER" };

        _userDomainServiceMock.Setup(s => s.CanAssignRoleToUserAsync(userId, roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        _userRepoMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _roleRepoMock.Setup(r => r.GetByIdAsync(roleId, It.IsAny<CancellationToken>())).ReturnsAsync(role);

        var command = new AssignRoleCommand(userId, roleId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _userRoleRepoMock.Verify(r => r.AddAsync(It.Is<UserRole>(ur => ur.UserId == userId && ur.RoleId == roleId), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNotFoundError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        _userDomainServiceMock.Setup(s => s.CanAssignRoleToUserAsync(userId, roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.User.NotFound(userId)));

        var command = new AssignRoleCommand(userId, roleId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.USER.NOT_FOUND");
    }

    [Fact]
    public async Task Handle_InactiveUser_ReturnsFailureError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        _userDomainServiceMock.Setup(s => s.CanAssignRoleToUserAsync(userId, roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.User.InactiveCannotReceiveRoles));

        var command = new AssignRoleCommand(userId, roleId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.USER.INACTIVE_ROLE_ASSIGNMENT");
    }

    [Fact]
    public async Task Handle_DuplicateRole_ReturnsConflictError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        _userDomainServiceMock.Setup(s => s.CanAssignRoleToUserAsync(userId, roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.Role.DuplicateAssignment("Manager")));

        var command = new AssignRoleCommand(userId, roleId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.ROLE.DUPLICATE_ASSIGNMENT");
    }
}

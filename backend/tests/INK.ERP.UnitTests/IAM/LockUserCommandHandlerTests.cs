using FluentAssertions;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.IAM.Commands.Users;
using INK.ERP.Domain.Common;

namespace INK.ERP.UnitTests.IAM;

public sealed class LockUserCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IGenericRepository<ApplicationUser>> _userRepoMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly Mock<IDateTime> _dateTimeMock;
    private readonly LockUserCommandHandler _handler;

    public LockUserCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _userRepoMock = new Mock<IGenericRepository<ApplicationUser>>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _dateTimeMock = new Mock<IDateTime>();

        _dateTimeMock.Setup(d => d.UtcNow).Returns(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        _unitOfWorkMock.Setup(u => u.Repository<ApplicationUser>()).Returns(_userRepoMock.Object);

        _handler = new LockUserCommandHandler(_unitOfWorkMock.Object, _currentUserServiceMock.Object, _dateTimeMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        // Arrange
        var targetUserId = Guid.NewGuid();
        var adminUserId = Guid.NewGuid();

        _currentUserServiceMock.Setup(c => c.UserId).Returns(adminUserId.ToString());

        var user = new ApplicationUser { Id = targetUserId, UserName = "target.user", IsLocked = false };
        _userRepoMock.Setup(r => r.GetByIdAsync(targetUserId, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var command = new LockUserCommand(targetUserId, DateTime.UtcNow.AddDays(7));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        user.IsLocked.Should().BeTrue();
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNotFoundError()
    {
        // Arrange
        var targetUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(c => c.UserId).Returns(Guid.NewGuid().ToString());
        _userRepoMock.Setup(r => r.GetByIdAsync(targetUserId, It.IsAny<CancellationToken>())).ReturnsAsync((ApplicationUser?)null);

        var command = new LockUserCommand(targetUserId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.USER.NOT_FOUND");
    }

    [Fact]
    public async Task Handle_LockingSelf_ReturnsFailureError()
    {
        // Arrange
        var selfUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(c => c.UserId).Returns(selfUserId.ToString());

        var command = new LockUserCommand(selfUserId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.USER.CANNOT_LOCK_SELF");
    }
}

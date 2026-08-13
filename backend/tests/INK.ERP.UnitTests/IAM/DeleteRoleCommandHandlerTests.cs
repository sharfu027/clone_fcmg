using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.IAM.Commands.Roles;
using INK.ERP.Application.Features.IAM.Services;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.UnitTests.IAM;

public sealed class DeleteRoleCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IGenericRepository<ApplicationRole>> _roleRepoMock;
    private readonly Mock<IRoleDomainService> _roleDomainServiceMock;
    private readonly Mock<IDateTime> _dateTimeMock;
    private readonly Mock<ILogger<DeleteRoleCommandHandler>> _loggerMock;
    private readonly DeleteRoleCommandHandler _handler;

    public DeleteRoleCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _roleRepoMock = new Mock<IGenericRepository<ApplicationRole>>();
        _roleDomainServiceMock = new Mock<IRoleDomainService>();
        _dateTimeMock = new Mock<IDateTime>();
        _loggerMock = new Mock<ILogger<DeleteRoleCommandHandler>>();

        _dateTimeMock.Setup(d => d.UtcNow).Returns(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        _unitOfWorkMock.Setup(u => u.Repository<ApplicationRole>()).Returns(_roleRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<SecurityAuditLog>()).Returns(new Mock<IGenericRepository<SecurityAuditLog>>().Object);

        _handler = new DeleteRoleCommandHandler(
            _unitOfWorkMock.Object,
            _roleDomainServiceMock.Object,
            _dateTimeMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        // Arrange
        var roleId = Guid.NewGuid();
        var role = new ApplicationRole { Id = roleId, Code = "CUSTOM_ROLE", IsSystem = false, IsActive = true };

        _roleDomainServiceMock.Setup(s => s.CanDeleteRoleAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        _roleRepoMock.Setup(r => r.GetByIdAsync(roleId, It.IsAny<CancellationToken>())).ReturnsAsync(role);

        var command = new DeleteRoleCommand(roleId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        role.IsDeleted.Should().BeTrue();
        role.IsActive.Should().BeFalse();
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_RoleNotFound_ReturnsNotFoundError()
    {
        // Arrange
        var roleId = Guid.NewGuid();
        _roleDomainServiceMock.Setup(s => s.CanDeleteRoleAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.Role.NotFound(roleId)));

        var command = new DeleteRoleCommand(roleId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.ROLE.NOT_FOUND");
    }

    [Fact]
    public async Task Handle_SystemRole_ReturnsFailureError()
    {
        // Arrange
        var roleId = Guid.NewGuid();
        _roleDomainServiceMock.Setup(s => s.CanDeleteRoleAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.Role.CannotDeleteSystemRole));

        var command = new DeleteRoleCommand(roleId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.ROLE.SYSTEM_ROLE_CANNOT_BE_DELETED");
    }
}

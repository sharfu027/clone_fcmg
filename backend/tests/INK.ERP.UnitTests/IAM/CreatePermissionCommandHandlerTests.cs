using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.IAM.Commands.Permissions;
using INK.ERP.Application.Features.IAM.Services;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.UnitTests.IAM;

public sealed class CreatePermissionCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IGenericRepository<Permission>> _permRepoMock;
    private readonly Mock<IPermissionDomainService> _permDomainServiceMock;
    private readonly Mock<IDateTime> _dateTimeMock;
    private readonly Mock<ILogger<CreatePermissionCommandHandler>> _loggerMock;
    private readonly CreatePermissionCommandHandler _handler;

    public CreatePermissionCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _permRepoMock = new Mock<IGenericRepository<Permission>>();
        _permDomainServiceMock = new Mock<IPermissionDomainService>();
        _dateTimeMock = new Mock<IDateTime>();
        _loggerMock = new Mock<ILogger<CreatePermissionCommandHandler>>();

        _dateTimeMock.Setup(d => d.UtcNow).Returns(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        _unitOfWorkMock.Setup(u => u.Repository<Permission>()).Returns(_permRepoMock.Object);

        _handler = new CreatePermissionCommandHandler(
            _unitOfWorkMock.Object,
            _permDomainServiceMock.Object,
            _dateTimeMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccessWithPermissionId()
    {
        // Arrange
        var groupId = Guid.NewGuid();

        _permDomainServiceMock.Setup(s => s.CanCreatePermissionAsync("users:create", groupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var command = new CreatePermissionCommand("Create User", "users:create", "Allows creating users", groupId, 1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
        _permRepoMock.Verify(r => r.AddAsync(It.Is<Permission>(p => p.Code == "users:create"), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PermissionGroupNotFound_ReturnsNotFoundError()
    {
        // Arrange
        var groupId = Guid.NewGuid();
        _permDomainServiceMock.Setup(s => s.CanCreatePermissionAsync("users:create", groupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.Permission.GroupNotFound(groupId)));

        var command = new CreatePermissionCommand("Create User", "users:create", "Description", groupId, 1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.PERMISSION.GROUP_NOT_FOUND");
    }

    [Fact]
    public async Task Handle_DuplicateCode_ReturnsConflictError()
    {
        // Arrange
        var groupId = Guid.NewGuid();
        _permDomainServiceMock.Setup(s => s.CanCreatePermissionAsync("users:create", groupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(INK.ERP.Application.Features.IAM.IamErrors.Permission.CodeAlreadyExists("users:create")));

        var command = new CreatePermissionCommand("Create User", "users:create", "Description", groupId, 1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.PERMISSION.DUPLICATE_CODE");
    }
}

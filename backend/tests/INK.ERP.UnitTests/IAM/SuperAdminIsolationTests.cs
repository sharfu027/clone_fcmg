using Moq;
using Xunit;
using FluentAssertions;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.IAM.Commands.Users;
using INK.ERP.Application.Features.IAM.DTOs;
using INK.ERP.Application.Features.IAM.Filters;
using INK.ERP.Application.Features.IAM.Queries.Users;
using INK.ERP.Application.Features.IAM.Services;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using Microsoft.Extensions.Logging;

namespace INK.ERP.UnitTests.IAM;

public class SuperAdminIsolationTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork = new();
    private readonly Mock<ICurrentUserService> _mockCurrentUserService = new();
    private readonly Mock<ISessionRevocationService> _mockSessionRevocationService = new();
    private readonly Mock<IUserDomainService> _mockUserDomainService = new();
    private readonly Mock<IDateTime> _mockDateTime = new();
    private readonly Mock<ILogger<AssignRoleCommandHandler>> _mockAssignLogger = new();
    private readonly Mock<IUserRepository> _mockUserRepo = new();
    private readonly Mock<IGenericRepository<UserRole>> _mockUserRoleRepo = new();
    private readonly Mock<IGenericRepository<ApplicationRole>> _mockRoleRepo = new();

    public SuperAdminIsolationTests()
    {
        _mockUnitOfWork.Setup(u => u.Repository<ApplicationUser>()).Returns(_mockUserRepo.Object);
        _mockUnitOfWork.Setup(u => u.Repository<UserRole>()).Returns(_mockUserRoleRepo.Object);
        _mockUnitOfWork.Setup(u => u.Repository<ApplicationRole>()).Returns(_mockRoleRepo.Object);
        _mockDateTime.Setup(d => d.UtcNow).Returns(DateTime.UtcNow);
    }

    [Fact]
    public async Task GetUserById_WhenSubAdminRequestsSuperAdmin_ReturnsNotFound()
    {
        // Arrange
        var superAdminId = Guid.NewGuid();
        var subAdminId = Guid.NewGuid();
        var superAdminRoleGuid = Guid.NewGuid();

        _mockCurrentUserService.Setup(c => c.UserId).Returns(subAdminId.ToString());
        _mockCurrentUserService.Setup(c => c.Roles).Returns(new List<string> { "Admin" });

        var superAdminUser = new ApplicationUser
        {
            Id = superAdminId,
            UserName = "superadmin",
            Email = "superadmin@inkerp.com",
            DisplayName = "Super Admin",
            IsActive = true,
            IsDeleted = false
        };

        _mockUserRepo.Setup(r => r.GetByIdAsync(superAdminId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(superAdminUser);

        _mockUserRoleRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<UserRole, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserRole> { new() { UserId = superAdminId, RoleId = superAdminRoleGuid } });

        _mockRoleRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ApplicationRole, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationRole> { new() { Id = superAdminRoleGuid, Name = "Super Admin", Code = "SUPER_ADMIN" } });

        var handler = new GetUserByIdQueryHandler(_mockUnitOfWork.Object, _mockCurrentUserService.Object);

        // Act
        var result = await handler.Handle(new GetUserByIdQuery(superAdminId), CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.USER.NOT_FOUND");
    }

    [Fact]
    public async Task AssignRoleCommand_WhenSubAdminAssignsSuperAdmin_ReturnsForbidden()
    {
        // Arrange
        var subAdminId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        var superAdminRoleId = Guid.NewGuid();

        _mockCurrentUserService.Setup(c => c.UserId).Returns(subAdminId.ToString());
        _mockCurrentUserService.Setup(c => c.Username).Returns("subadmin_user");
        _mockCurrentUserService.Setup(c => c.Roles).Returns(new List<string> { "Admin" });

        _mockUserDomainService.Setup(s => s.CanAssignRoleToUserAsync(targetUserId, superAdminRoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var targetUser = new ApplicationUser { Id = targetUserId, UserName = "target_user", IsActive = true };
        var superAdminRole = new ApplicationRole { Id = superAdminRoleId, Name = "Super Admin", Code = "SUPER_ADMIN" };

        _mockUserRepo.Setup(r => r.GetByIdAsync(targetUserId, It.IsAny<CancellationToken>())).ReturnsAsync(targetUser);
        _mockRoleRepo.Setup(r => r.GetByIdAsync(superAdminRoleId, It.IsAny<CancellationToken>())).ReturnsAsync(superAdminRole);

        var handler = new AssignRoleCommandHandler(
            _mockUnitOfWork.Object,
            _mockUserDomainService.Object,
            _mockCurrentUserService.Object,
            _mockSessionRevocationService.Object,
            _mockDateTime.Object,
            _mockAssignLogger.Object);

        // Act
        var result = await handler.Handle(new AssignRoleCommand(targetUserId, superAdminRoleId), CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.PrivilegeEscalation");
        _mockSessionRevocationService.Verify(s => s.RevokeUserSessions(It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task AssignRoleCommand_WhenSuperAdminAssignsSubAdmin_SucceedsAndRevokesSession()
    {
        // Arrange
        var superAdminId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        var subAdminRoleId = Guid.NewGuid();

        _mockCurrentUserService.Setup(c => c.UserId).Returns(superAdminId.ToString());
        _mockCurrentUserService.Setup(c => c.Username).Returns("superadmin_boss");
        _mockCurrentUserService.Setup(c => c.Roles).Returns(new List<string> { "Super Admin" });

        _mockUserDomainService.Setup(s => s.CanAssignRoleToUserAsync(targetUserId, subAdminRoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var targetUser = new ApplicationUser { Id = targetUserId, UserName = "target_user", IsActive = true };
        var subAdminRole = new ApplicationRole { Id = subAdminRoleId, Name = "Admin", Code = "ADMIN" };

        _mockUserRepo.Setup(r => r.GetByIdAsync(targetUserId, It.IsAny<CancellationToken>())).ReturnsAsync(targetUser);
        _mockRoleRepo.Setup(r => r.GetByIdAsync(subAdminRoleId, It.IsAny<CancellationToken>())).ReturnsAsync(subAdminRole);

        var handler = new AssignRoleCommandHandler(
            _mockUnitOfWork.Object,
            _mockUserDomainService.Object,
            _mockCurrentUserService.Object,
            _mockSessionRevocationService.Object,
            _mockDateTime.Object,
            _mockAssignLogger.Object);

        // Act
        var result = await handler.Handle(new AssignRoleCommand(targetUserId, subAdminRoleId), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _mockSessionRevocationService.Verify(s => s.RevokeUserSessions(targetUserId, It.Is<string>(r => r.Contains("Admin"))), Times.Once);
    }
}

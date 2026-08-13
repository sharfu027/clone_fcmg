using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Infrastructure.Security;
using INK.ERP.Persistence;

namespace INK.ERP.UnitTests.Infrastructure;

public sealed class PermissionResolverTests
{
    private readonly Mock<ICacheService> _cacheServiceMock;

    public PermissionResolverTests()
    {
        _cacheServiceMock = new Mock<ICacheService>();
    }

    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetPermissionsForUserAsync_CachedPermissionsExist_ReturnsCachedList()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var userId = Guid.NewGuid();
        var cachedList = new List<string> { "users:read", "users:write" };

        _cacheServiceMock.Setup(c => c.GetAsync<List<string>>($"iam:permissions:user:{userId}", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cachedList);

        var resolver = new PermissionResolver(context, _cacheServiceMock.Object);

        // Act
        var result = await resolver.GetPermissionsForUserAsync(userId, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(cachedList);
    }

    [Fact]
    public async Task HasPermissionAsync_UserHasPermission_ReturnsTrue()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var userId = Guid.NewGuid();
        var cachedList = new List<string> { "users:read", "users:write" };

        _cacheServiceMock.Setup(c => c.GetAsync<List<string>>($"iam:permissions:user:{userId}", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cachedList);

        var resolver = new PermissionResolver(context, _cacheServiceMock.Object);

        // Act
        var hasPermission = await resolver.HasPermissionAsync(userId, "users:read", CancellationToken.None);

        // Assert
        hasPermission.Should().BeTrue();
    }
}

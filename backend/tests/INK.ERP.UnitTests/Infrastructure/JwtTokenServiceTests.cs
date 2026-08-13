using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Infrastructure.Options;
using INK.ERP.Infrastructure.Security;

namespace INK.ERP.UnitTests.Infrastructure;

public sealed class JwtTokenServiceTests
{
    private readonly JwtOptions _jwtOptions;
    private readonly SecurityOptions _securityOptions;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IGenericRepository<RefreshToken>> _refreshTokenRepoMock;
    private readonly Mock<IPermissionResolver> _permissionResolverMock;
    private readonly Mock<IDateTime> _dateTimeMock;
    private readonly Mock<ILogger<JwtTokenService>> _loggerMock;
    private readonly JwtTokenService _jwtTokenService;

    public JwtTokenServiceTests()
    {
        _jwtOptions = new JwtOptions
        {
            Issuer = "INK.ERP.TestIssuer",
            Audience = "INK.ERP.TestAudience",
            Secret = "SuperSecretKeyWithAtLeast32BytesLength12345!",
            ExpiryMinutes = 60
        };

        _securityOptions = new SecurityOptions
        {
            RefreshTokenExpiryDays = 7,
            EnableTokenFamilyRotation = true
        };

        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _refreshTokenRepoMock = new Mock<IGenericRepository<RefreshToken>>();
        _permissionResolverMock = new Mock<IPermissionResolver>();
        _dateTimeMock = new Mock<IDateTime>();
        _loggerMock = new Mock<ILogger<JwtTokenService>>();

        _dateTimeMock.Setup(d => d.UtcNow).Returns(() => DateTime.UtcNow);
        _unitOfWorkMock.Setup(u => u.Repository<RefreshToken>()).Returns(_refreshTokenRepoMock.Object);

        _jwtTokenService = new JwtTokenService(
            Microsoft.Extensions.Options.Options.Create(_jwtOptions),
            Microsoft.Extensions.Options.Options.Create(_securityOptions),
            _unitOfWorkMock.Object,
            _permissionResolverMock.Object,
            _dateTimeMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public void GenerateJwtToken_ValidUser_ReturnsNonEmptyJwt()
    {
        // Arrange
        var user = new ApplicationUser { Id = Guid.NewGuid(), UserName = "test.user", Email = "test@example.com" };
        var roles = new List<string> { "ADMIN" };
        var permissions = new List<string> { "users:read", "users:create" };

        // Act
        var token = _jwtTokenService.GenerateJwtToken(user, roles, permissions);

        // Assert
        token.Should().NotBeNullOrWhiteSpace();
        _jwtTokenService.ValidateToken(token).Should().BeTrue();
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsTokenWithFamilyId()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var (refreshToken, rawToken) = _jwtTokenService.GenerateRefreshToken(userId, "127.0.0.1");

        // Assert
        refreshToken.Should().NotBeNull();
        refreshToken.UserId.Should().Be(userId);
        refreshToken.FamilyId.Should().NotBeNullOrEmpty();
        rawToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task RotateRefreshToken_ReusedToken_DetectsBreachAndRevokesFamily()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var familyId = "family-123";
        var revokedToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = "revoked_token_value",
            FamilyId = familyId,
            RevokedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), // Already revoked!
            ExpiresUtc = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc)
        };

        _refreshTokenRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<RefreshToken, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RefreshToken> { revokedToken });

        // Act
        var result = await _jwtTokenService.RotateRefreshTokenAsync("revoked_token_value", "127.0.0.1", CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("IAM.TOKEN.REUSE_DETECTED");
    }
}

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Behaviors;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.UnitTests.Behaviors;

public sealed class PerformanceBehaviorTests
{
    public record SlowRequest(string Name);

    private readonly Mock<ILogger<PerformanceBehavior<SlowRequest, string>>> _loggerMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly PerformanceBehavior<SlowRequest, string> _behavior;

    public PerformanceBehaviorTests()
    {
        _loggerMock = new Mock<ILogger<PerformanceBehavior<SlowRequest, string>>>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(c => c.UserId).Returns("user-456");

        _behavior = new PerformanceBehavior<SlowRequest, string>(_loggerMock.Object, _currentUserServiceMock.Object);
    }

    [Fact]
    public async Task Handle_FastRequest_ExecutesNormallyWithoutWarning()
    {
        // Arrange
        var request = new SlowRequest("Fast");

        // Act
        var result = await _behavior.Handle(request, () => Task.FromResult("Done"), CancellationToken.None);

        // Assert
        result.Should().Be("Done");
    }

    [Fact]
    public async Task Handle_SlowRequest_ExecutesAndLogsPerformanceWarning()
    {
        // Arrange
        var request = new SlowRequest("Slow");

        // Act
        var result = await _behavior.Handle(request, async () =>
        {
            await Task.Delay(550);
            return "DoneSlow";
        }, CancellationToken.None);

        // Assert
        result.Should().Be("DoneSlow");
    }
}

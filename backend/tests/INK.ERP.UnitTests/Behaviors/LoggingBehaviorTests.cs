using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Behaviors;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.UnitTests.Behaviors;

public sealed class LoggingBehaviorTests
{
    public record SampleRequest(string Name);

    private readonly Mock<ILogger<LoggingBehavior<SampleRequest, string>>> _loggerMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly LoggingBehavior<SampleRequest, string> _behavior;

    public LoggingBehaviorTests()
    {
        _loggerMock = new Mock<ILogger<LoggingBehavior<SampleRequest, string>>>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(c => c.UserId).Returns("user-123");

        _behavior = new LoggingBehavior<SampleRequest, string>(_loggerMock.Object, _currentUserServiceMock.Object);
    }

    [Fact]
    public async Task Handle_SuccessfulExecution_LogsExecutionAndCompletion()
    {
        // Arrange
        var request = new SampleRequest("Sample");

        // Act
        var result = await _behavior.Handle(request, () => Task.FromResult("Response"), CancellationToken.None);

        // Assert
        result.Should().Be("Response");
    }

    [Fact]
    public async Task Handle_FailingExecution_LogsErrorAndRethrows()
    {
        // Arrange
        var request = new SampleRequest("Failing");

        // Act & Assert
        var act = async () => await _behavior.Handle(request, () => throw new Exception("Handler error"), CancellationToken.None);
        await act.Should().ThrowAsync<Exception>().WithMessage("Handler error");
    }
}

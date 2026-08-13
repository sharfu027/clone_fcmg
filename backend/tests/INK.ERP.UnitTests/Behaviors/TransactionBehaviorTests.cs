using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Behaviors;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.UnitTests.Behaviors;

public sealed class TransactionBehaviorTests
{
    public record SampleCommand(string Name) : ICommand<string>;
    public record SampleQuery(string Name) : IQuery<string>;

    private readonly Mock<ILogger<TransactionBehavior<SampleCommand, string>>> _loggerMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;

    public TransactionBehaviorTests()
    {
        _loggerMock = new Mock<ILogger<TransactionBehavior<SampleCommand, string>>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _unitOfWorkMock.Setup(u => u.ExecuteInTransactionAsync(It.IsAny<Func<Task<string>>>(), It.IsAny<CancellationToken>()))
            .Returns<Func<Task<string>>, CancellationToken>((action, ct) => action());
    }

    [Fact]
    public async Task Handle_NonCommandRequest_SkipsTransactionAndCallsNext()
    {
        // Arrange
        var loggerQueryMock = new Mock<ILogger<TransactionBehavior<SampleQuery, string>>>();
        var behavior = new TransactionBehavior<SampleQuery, string>(loggerQueryMock.Object, _unitOfWorkMock.Object);
        var request = new SampleQuery("TestQuery");

        // Act
        var result = await behavior.Handle(request, () => Task.FromResult("QueryResult"), CancellationToken.None);

        // Assert
        result.Should().Be("QueryResult");
        _unitOfWorkMock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_CommandSuccess_ExecutesInTransaction()
    {
        // Arrange
        var behavior = new TransactionBehavior<SampleCommand, string>(_loggerMock.Object, _unitOfWorkMock.Object);
        var request = new SampleCommand("TestCommand");

        // Act
        var result = await behavior.Handle(request, () => Task.FromResult("CommandResult"), CancellationToken.None);

        // Assert
        result.Should().Be("CommandResult");
        _unitOfWorkMock.Verify(u => u.ExecuteInTransactionAsync(It.IsAny<Func<Task<string>>>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_CommandFailure_RethrowsException()
    {
        // Arrange
        var behavior = new TransactionBehavior<SampleCommand, string>(_loggerMock.Object, _unitOfWorkMock.Object);
        var request = new SampleCommand("FailingCommand");

        // Act & Assert
        var act = async () => await behavior.Handle(request, () => throw new InvalidOperationException("DB Failure"), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("DB Failure");
        _unitOfWorkMock.Verify(u => u.ExecuteInTransactionAsync(It.IsAny<Func<Task<string>>>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}

using FluentAssertions;
using Moq;
using Xunit;
using INK.ERP.Domain.Common;
using INK.ERP.Application.Features.Security.Face;
using INK.ERP.Application.Features.Security.Face.DTOs;
using INK.ERP.Application.Features.Security.Face.Workflows;

namespace INK.ERP.UnitTests.Features.Security;

public sealed class FaceCommandHandlerTests
{
    private readonly Mock<IFaceEnrollmentWorkflow> _workflowMock;
    private readonly EnrollFaceCommandHandler _enrollHandler;

    public FaceCommandHandlerTests()
    {
        _workflowMock = new Mock<IFaceEnrollmentWorkflow>();
        _enrollHandler = new EnrollFaceCommandHandler(_workflowMock.Object);
    }

    [Fact]
    public async Task EnrollFaceCommand_WorkflowFails_ReturnsFailure()
    {
        // Arrange
        _workflowMock.Setup(w => w.ExecuteAsync(It.IsAny<EnrollFaceCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<FaceProfileDto>(new Error("SECURITY.FACE.LIVENESS_FAILED", "Liveness check failed.", ErrorType.Validation)));

        var command = new EnrollFaceCommand(Guid.NewGuid(), new byte[] { 1, 2, 3 });

        // Act
        var result = await _enrollHandler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("SECURITY.FACE.LIVENESS_FAILED");
    }

    [Fact]
    public async Task EnrollFaceCommand_WorkflowQualityFails_ReturnsQualityError()
    {
        // Arrange
        _workflowMock.Setup(w => w.ExecuteAsync(It.IsAny<EnrollFaceCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<FaceProfileDto>(new Error("SECURITY.FACE.QUALITY_CHECK_FAILED", "Image quality too low.", ErrorType.Validation)));

        var command = new EnrollFaceCommand(Guid.NewGuid(), new byte[] { 1, 2, 3 });

        // Act
        var result = await _enrollHandler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("SECURITY.FACE.QUALITY_CHECK_FAILED");
    }

    [Fact]
    public async Task EnrollFaceCommand_ValidImage_EnrollsSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var profileId = Guid.NewGuid();
        var profileDto = new FaceProfileDto(profileId, userId, "Active", true, 1, new List<FaceTemplateDto>());

        _workflowMock.Setup(w => w.ExecuteAsync(It.IsAny<EnrollFaceCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(profileDto));

        var command = new EnrollFaceCommand(userId, new byte[] { 1, 2, 3 });

        // Act
        var result = await _enrollHandler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(profileId);
    }
}

using FluentAssertions;
using MediatR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Application.Features.Security.Common;
using INK.ERP.Application.Features.Security.Events;
using INK.ERP.Application.Features.Security.Face;
using INK.ERP.Application.Features.Security.Face.DTOs;
using INK.ERP.Application.Features.Security.Face.Workflows;

namespace INK.ERP.UnitTests.Features.Security;

public sealed class FinalSecurityArchitectureRefinementTests
{
    private readonly Mock<IImageQualityService> _qualityServiceMock;
    private readonly Mock<ILivenessDetectionService> _livenessServiceMock;
    private readonly Mock<IFaceEmbeddingService> _embeddingServiceMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IFaceProfileRepository> _faceProfileRepoMock;
    private readonly Mock<IPublisher> _publisherMock;

    public FinalSecurityArchitectureRefinementTests()
    {
        _qualityServiceMock = new Mock<IImageQualityService>();
        _livenessServiceMock = new Mock<ILivenessDetectionService>();
        _embeddingServiceMock = new Mock<IFaceEmbeddingService>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _faceProfileRepoMock = new Mock<IFaceProfileRepository>();
        _publisherMock = new Mock<IPublisher>();

        _unitOfWorkMock.Setup(u => u.Repository<FaceProfile>()).Returns(_faceProfileRepoMock.Object);
    }

    [Fact]
    public async Task FaceValidationWorkflow_QualityScoreLow_ReturnsInvalidResult()
    {
        // Arrange
        _livenessServiceMock.Setup(l => l.DetectLivenessAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(true));

        _qualityServiceMock.Setup(q => q.ValidateQualityAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(0.50f)); // Score < 0.70 threshold!

        var workflow = new FaceValidationWorkflow(_qualityServiceMock.Object, _livenessServiceMock.Object);

        // Act
        var result = await workflow.ValidateAsync(new byte[] { 1, 2, 3 }, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.IsValid.Should().BeFalse();
        result.Value.ValidationErrors.Should().Contain(e => e.Contains("quality score"));
    }

    [Fact]
    public async Task FaceValidationWorkflow_ValidImage_ReturnsValidResult()
    {
        // Arrange
        _livenessServiceMock.Setup(l => l.DetectLivenessAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(true));

        _qualityServiceMock.Setup(q => q.ValidateQualityAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(0.92f));

        var workflow = new FaceValidationWorkflow(_qualityServiceMock.Object, _livenessServiceMock.Object);

        // Act
        var result = await workflow.ValidateAsync(new byte[] { 1, 2, 3 }, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.IsValid.Should().BeTrue();
        result.Value.QualityScore.Should().Be(0.92f);
    }

    [Fact]
    public void AuthenticationContextBuilder_FluentChaining_BuildsImmutableContext()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        var coord = new GpsCoordinate(24.8607, 67.0011);
        var fingerprint = new DeviceFingerprint("hash-abc", "Desktop", "Dell XPS", "Windows 11");

        // Act
        var context = new AuthenticationContextBuilder()
            .WithUser(userId)
            .WithDevice(deviceId, fingerprint)
            .WithGps(coord)
            .WithClientInfo("10.0.0.1")
            .WithCorrelationId("corr-999")
            .Build();

        // Assert
        context.UserId.Should().Be(userId);
        context.DeviceId.Should().Be(deviceId);
        context.DeviceFingerprint?.DeviceModel.Should().Be("Dell XPS");
        context.GpsCoordinate?.Latitude.Should().Be(24.8607);
        context.CorrelationId.Should().Be("corr-999");
    }

    [Fact]
    public async Task FaceEnrollmentWorkflow_ComposesValidationAndEmbedding_PublishesApplicationEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var validationWorkflowMock = new Mock<IFaceValidationWorkflow>();
        validationWorkflowMock.Setup(v => v.ValidateAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new FaceValidationResult(true, 0.95f, true, new List<string>())));

        var embedding = new FaceEmbedding("vector_metadata", 512, "v2.0", 0.95f);
        var embeddingResult = new FaceEmbeddingResult(
            embedding, 0.95f, "v2.0", 512, TimeSpan.FromMilliseconds(45),
            "InsightFaceProvider", "sha256-checksum", "GPU-0", "v2.0.1", new List<string>());

        _embeddingServiceMock.Setup(e => e.GenerateEmbeddingAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(embeddingResult));

        _faceProfileRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<FaceProfile, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<FaceProfile>());

        var loggerMock = new Mock<ILogger<FaceEnrollmentWorkflow>>();
        var workflow = new FaceEnrollmentWorkflow(
            validationWorkflowMock.Object,
            _embeddingServiceMock.Object,
            _faceProfileRepoMock.Object,
            _unitOfWorkMock.Object,
            _publisherMock.Object,
            loggerMock.Object);

        var command = new EnrollFaceCommand(userId, new byte[] { 10, 20, 30 });

        // Act
        var result = await workflow.ExecuteAsync(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _publisherMock.Verify(p => p.Publish(It.IsAny<FaceEnrollmentCompletedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}

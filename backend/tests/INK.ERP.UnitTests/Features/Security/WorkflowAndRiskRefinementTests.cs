using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Services.Security;
using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Application.Features.Security.Common;
using INK.ERP.Application.Features.Security.Face;
using INK.ERP.Application.Features.Security.Face.DTOs;
using INK.ERP.Application.Features.Security.Face.Workflows;
using INK.ERP.Application.Features.Security.Risk;
using INK.ERP.Application.Features.Security.Policies.DTOs;

namespace INK.ERP.UnitTests.Features.Security;

public sealed class WorkflowAndRiskRefinementTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IFaceProfileRepository> _faceProfileRepoMock;
    private readonly Mock<IFaceEmbeddingService> _embeddingServiceMock;
    private readonly Mock<IImageQualityService> _qualityServiceMock;
    private readonly Mock<ILivenessDetectionService> _livenessServiceMock;
    private readonly Mock<ILogger<FaceEnrollmentWorkflow>> _loggerMock;
    private readonly FaceEnrollmentWorkflow _workflow;

    public WorkflowAndRiskRefinementTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _faceProfileRepoMock = new Mock<IFaceProfileRepository>();
        _embeddingServiceMock = new Mock<IFaceEmbeddingService>();
        _qualityServiceMock = new Mock<IImageQualityService>();
        _livenessServiceMock = new Mock<ILivenessDetectionService>();
        _loggerMock = new Mock<ILogger<FaceEnrollmentWorkflow>>();

        _unitOfWorkMock.Setup(u => u.Repository<FaceProfile>()).Returns(_faceProfileRepoMock.Object);

        var validationWorkflowMock = new Mock<IFaceValidationWorkflow>();
        validationWorkflowMock
            .Setup(v => v.ValidateAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new FaceValidationResult(true, 0.95f, true, new List<string>())));
        var publisherMock = new Mock<MediatR.IPublisher>();

        _workflow = new FaceEnrollmentWorkflow(
            validationWorkflowMock.Object,
            _embeddingServiceMock.Object,
            _faceProfileRepoMock.Object,
            _unitOfWorkMock.Object,
            publisherMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task FaceEnrollmentWorkflow_ValidImage_ReturnsFaceProfileDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _livenessServiceMock.Setup(l => l.DetectLivenessAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(true));

        _qualityServiceMock.Setup(q => q.ValidateQualityAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(0.95f));

        var embedding = new FaceEmbedding("vector_xyz", 512, "v1.0", 0.95f);
        var embeddingResult = new FaceEmbeddingResult(embedding, 0.95f, "v1.0", 512, TimeSpan.FromMilliseconds(50), "LocalProvider", "checksum123", "CPU", "v1.0", new List<string>());

        _embeddingServiceMock.Setup(e => e.GenerateEmbeddingAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(embeddingResult));

        _faceProfileRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<FaceProfile, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<FaceProfile>());

        var command = new EnrollFaceCommand(userId, new byte[] { 10, 20, 30 });

        // Act
        var result = await _workflow.ExecuteAsync(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.UserId.Should().Be(userId);
        result.Value.ActiveTemplateVersion.Should().Be(1);
    }

    [Fact]
    public void AuthenticationContext_Initialization_StoresContextValuesData()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var coord = new GpsCoordinate(51.5074, -0.1278);
        var fingerprint = new DeviceFingerprint("hash123", "Mobile", "Pixel 8", "Android 14");
        var policySnapshot = new EffectiveSecurityPolicyDto("StrictMatching", 0.85f, "RequiredStrict", 150.0, "BiometricAndGeofence", true);

        // Act
        var context = new AuthenticationContext(
            UserId: userId,
            DeviceId: Guid.NewGuid(),
            DeviceFingerprint: fingerprint,
            GpsCoordinate: coord,
            IpAddress: "192.168.1.1",
            CurrentUtcTime: DateTime.UtcNow,
            SecurityPolicySnapshot: policySnapshot,
            CorrelationId: "corr-1234");

        // Assert
        context.UserId.Should().Be(userId);
        context.GpsCoordinate?.Latitude.Should().Be(51.5074);
        context.DeviceFingerprint?.DeviceModel.Should().Be("Pixel 8");
        context.SecurityPolicySnapshot?.FaceMode.Should().Be("StrictMatching");
    }

    [Fact]
    public void GeofenceDto_CircularShape_InstantiatesCorrectly()
    {
        // Arrange
        var center = new GpsCoordinate(24.8607, 67.0011);

        // Act
        var geofence = new GeofenceDto(
            Name: "Main Warehouse Geofence",
            Shape: GeofenceShape.Circular,
            Center: center,
            RadiusMeters: 200.0);

        // Assert
        geofence.Name.Should().Be("Main Warehouse Geofence");
        geofence.Shape.Should().Be(GeofenceShape.Circular);
        geofence.RadiusMeters.Should().Be(200.0);
    }
}

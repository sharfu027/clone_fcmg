using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Security.Common;
using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Infrastructure.Options;
using INK.ERP.Infrastructure.Security.Devices;
using INK.ERP.Infrastructure.Security.Face;
using INK.ERP.Infrastructure.Security.GPS;
using INK.ERP.Infrastructure.Security.Health;
using INK.ERP.Infrastructure.Security.Risk;

namespace INK.ERP.UnitTests.Infrastructure.Security;

public sealed class SecurityInfrastructureUnitTests
{
    [Fact]
    public void FaceComparisonService_IdenticalVectors_ReturnsCosineSimilarityOne()
    {
        // Arrange
        var optionsMock = Options.Create(new FaceRecognitionOptions { MatchThreshold = 0.85f });
        var strategy = new CosineStrategy();
        var loggerMock = new Mock<ILogger<FaceComparisonService>>();
        var protectionServiceMock = new Mock<IFaceTemplateProtectionService>();
        var service = new FaceComparisonService(strategy, protectionServiceMock.Object, optionsMock, loggerMock.Object);

        var vectorA = new float[] { 0.5f, 0.5f, 0.5f, 0.5f };
        var vectorB = new float[] { 0.5f, 0.5f, 0.5f, 0.5f };

        // Act
        var result = service.Compare(vectorA, vectorB);

        // Assert
        result.SimilarityScore.Should().BeApproximately(1.0f, 0.001f);
        result.IsMatch.Should().BeTrue();
        result.EuclideanDistance.Should().Be(0.0);
    }

    [Fact]
    public void FaceTemplateProtectionService_EncryptAndDecrypt_ReturnsOriginalString()
    {
        // Arrange
        var optionsMock = Options.Create(new EncryptionOptions
        {
            MasterKey = "c3VwZXJfc2VjcmV0X2Flc18yNTZfbWFzdGVyX2tleV8xMjM0NTY3ODk=",
            KeyVersion = 1
        });
        var service = new FaceTemplateProtectionService(optionsMock);

        string rawVectorData = "0.123,0.456,0.789,0.999";

        // Act
        string encrypted = service.EncryptEmbedding(rawVectorData);
        string decrypted = service.DecryptEmbedding(encrypted);

        // Assert
        encrypted.Should().StartWith("ENC:v1:");
        decrypted.Should().Be(rawVectorData);
    }

    [Fact]
    public async Task GpsVerificationService_ExceedsMaxSpeed_DetectsSpoofing()
    {
        // Arrange
        var optionsMock = Options.Create(new GpsOptions { MaxSpeedKmH = 1000.0, EnableSpoofDetection = true });
        var loggerMock = new Mock<ILogger<GpsVerificationService>>();
        var service = new GpsVerificationService(optionsMock, loggerMock.Object);

        var coord = new GpsCoordinate(24.8607, 67.0011);
        var accuracy = new GeoAccuracy(10.0, 400.0); // 400 m/s = 1440 km/h > 1000 limit

        // Act
        var result = await service.ValidateGpsAsync(coord, accuracy, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("SECURITY.GPS.SPOOFING_DETECTED");
    }

    [Fact]
    public async Task GeofenceService_CircularGeofence_ValidatesCoordinateInside()
    {
        // Arrange
        var loggerMock = new Mock<ILogger<GeofenceService>>();
        var service = new GeofenceService(loggerMock.Object);

        var center = new GpsCoordinate(24.8607, 67.0011);
        var geofence = new GeofenceDto("Warehouse", GeofenceShape.Circular, Center: center, RadiusMeters: 500.0);

        var insideCoord = new GpsCoordinate(24.8610, 67.0012); // ~35 meters away

        // Act
        var result = await service.IsWithinGeofenceAsync(insideCoord, geofence, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeTrue();
    }

    [Fact]
    public async Task DeviceFingerprintService_GeneratesConsistentSHA256Hash()
    {
        // Arrange
        var loggerMock = new Mock<ILogger<DeviceFingerprintService>>();
        var service = new DeviceFingerprintService(loggerMock.Object);

        // Act
        var res1 = await service.GenerateFingerprintAsync("Mobile", "iPhone 15", "iOS 17", "raw-device-id-123");
        var res2 = await service.GenerateFingerprintAsync("Mobile", "iPhone 15", "iOS 17", "raw-device-id-123");

        // Assert
        res1.IsSuccess.Should().BeTrue();
        res1.Value.FingerprintHash.Should().Be(res2.Value.FingerprintHash);
    }

    [Fact]
    public async Task FaceModelHealthCheck_LoadedModel_ReturnsHealthy()
    {
        // Arrange
        var modelLoaderMock = new Mock<IModelLoader>();
        modelLoaderMock.Setup(m => m.IsLoaded).Returns(true);
        modelLoaderMock.Setup(m => m.Version).Returns("v2.1");
        modelLoaderMock.Setup(m => m.Checksum).Returns("sha256-abc12345");
        modelLoaderMock.Setup(m => m.ExecutionProvider).Returns("CPU");

        var healthCheck = new FaceModelHealthCheck(modelLoaderMock.Object);

        // Act
        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        result.Status.Should().Be(HealthStatus.Healthy);
        result.Data["ModelVersion"].Should().Be("v2.1");
    }
}

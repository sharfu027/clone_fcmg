using FluentAssertions;
using Xunit;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.Events.Security;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.UnitTests.Domain.Security;

public sealed class FaceProfileTests
{
    [Fact]
    public void Enroll_ValidEmbedding_AddsTemplateAndRaisesEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var profile = new FaceProfile(userId);
        var embedding = new FaceEmbedding("vector_sample", 512, "v1.0", 0.95f);

        // Act
        profile.Enroll(embedding);

        // Assert
        profile.Status.Should().Be(FaceEnrollmentStatus.Enrolled);
        profile.Templates.Should().HaveCount(1);
        profile.ActiveTemplateVersion.Should().Be(1);
        profile.DomainEvents.Should().ContainSingle(e => e is FaceEnrolledEvent);
    }

    [Fact]
    public void Enroll_MoreThan5Templates_RotatesWeakestTemplateSuccessfully()
    {
        // Arrange
        var profile = new FaceProfile(Guid.NewGuid());
        for (int i = 0; i < 5; i++)
        {
            profile.Enroll(new FaceEmbedding($"vector_sample_{i}", 512, "v1.0", 0.80f + (i * 0.02f)));
        }

        // Act
        profile.Enroll(new FaceEmbedding("vector_sample_new", 512, "v1.0", 0.99f));

        // Assert
        profile.Templates.Count(t => t.IsActive).Should().BeLessThanOrEqualTo(5);
    }

    [Fact]
    public void RecordVerification_InactiveProfile_ThrowsInvalidOperationException()
    {
        // Arrange
        var profile = new FaceProfile(Guid.NewGuid());
        profile.Deactivate();

        // Act & Assert
        profile.Invoking(p => p.RecordVerification(0.9f, true))
            .Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot verify inactive face profile.");
    }

    [Fact]
    public void RecordVerification_Success_RaisesFaceVerifiedEvent()
    {
        // Arrange
        var profile = new FaceProfile(Guid.NewGuid());
        profile.Enroll(new FaceEmbedding("vector_sample", 512, "v1.0", 0.95f));
        profile.ClearDomainEvents();

        // Act
        profile.RecordVerification(0.92f, true);

        // Assert
        profile.VerificationLogs.Should().HaveCount(1);
        profile.DomainEvents.Should().ContainSingle(e => e is FaceVerifiedEvent);
    }
}

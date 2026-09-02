using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Security;

public sealed class FaceProfileConfiguration : IEntityTypeConfiguration<FaceProfile>
{
    public void Configure(EntityTypeBuilder<FaceProfile> builder)
    {
        builder.ToTable("face_profiles", "iam");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.ActiveTemplateVersion).IsRequired();
        builder.Property(x => x.ConcurrencyToken).HasMaxLength(100);
        builder.Ignore(x => x.ModifiedBy);

        builder.HasIndex(x => x.UserId).IsUnique();

        builder.HasMany(x => x.Templates)
            .WithOne()
            .HasForeignKey("FaceProfileId")
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.VerificationLogs)
            .WithOne()
            .HasForeignKey(x => x.FaceProfileId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.EnrollmentLogs)
            .WithOne()
            .HasForeignKey(x => x.FaceProfileId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class FaceTemplateConfiguration : IEntityTypeConfiguration<FaceTemplate>
{
    public void Configure(EntityTypeBuilder<FaceTemplate> builder)
    {
        builder.ToTable("face_templates", "iam");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Version).IsRequired();
        builder.Property(x => x.VectorData).IsRequired();
        builder.Property(x => x.AlgorithmVersion).HasMaxLength(50).IsRequired();
        builder.Property(x => x.QualityScore).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.ConcurrencyToken).HasMaxLength(100);
        builder.Ignore(x => x.ModifiedBy);

        // Explicitly Ignore Unmapped Metadata Fields To Prevent PostgreSQL Undefined Column Exceptions (42703)
        builder.Ignore(x => x.ModelName);
        builder.Ignore(x => x.ModelChecksum);
        builder.Ignore(x => x.ModelDate);
        builder.Ignore(x => x.EmbeddingDimension);
        builder.Ignore(x => x.Provider);
        builder.Ignore(x => x.NormalizationVersion);
        builder.Ignore(x => x.TimesUsed);
        builder.Ignore(x => x.SuccessCount);
        builder.Ignore(x => x.AverageSimilarity);
        builder.Ignore(x => x.LastSuccessfulLoginUtc);

        builder.HasIndex(x => x.Version);
    }
}

public sealed class FaceVerificationLogConfiguration : IEntityTypeConfiguration<FaceVerificationLog>
{
    public void Configure(EntityTypeBuilder<FaceVerificationLog> builder)
    {
        builder.ToTable("face_verification_logs", "iam");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FaceProfileId).IsRequired();
        builder.Property(x => x.MatchScore).IsRequired();
        builder.Property(x => x.IsSuccessful).IsRequired();
        builder.Property(x => x.DeviceId).HasMaxLength(100);
        builder.Property(x => x.FailureReason).HasMaxLength(500);

        builder.HasIndex(x => x.CreatedAtUtc);
    }
}

public sealed class FaceEnrollmentLogConfiguration : IEntityTypeConfiguration<FaceEnrollmentLog>
{
    public void Configure(EntityTypeBuilder<FaceEnrollmentLog> builder)
    {
        builder.ToTable("face_enrollment_logs", "iam");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FaceProfileId).IsRequired();
        builder.Property(x => x.TemplateVersion).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(500);
    }
}

public sealed class SecurityPolicyConfiguration : IEntityTypeConfiguration<SecurityPolicy>
{
    public void Configure(EntityTypeBuilder<SecurityPolicy> builder)
    {
        builder.ToTable("security_policies", "iam");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.FaceMode).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.MinFaceConfidenceScore).IsRequired();
        builder.Property(x => x.GpsMode).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.MaxAllowedGpsRadiusMeters).IsRequired();
        builder.Property(x => x.PasswordMinLength).IsRequired();
        builder.Property(x => x.PasswordRequireSpecialChar).IsRequired();
        builder.Property(x => x.LockoutThresholdAttempts).IsRequired();
        builder.Property(x => x.AttendanceMode).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.RequireDeviceRegistration).IsRequired();
        builder.Property(x => x.MaxDevicesPerUser).IsRequired();
    }
}

public sealed class UserSecurityPolicyConfiguration : IEntityTypeConfiguration<UserSecurityPolicy>
{
    public void Configure(EntityTypeBuilder<UserSecurityPolicy> builder)
    {
        builder.ToTable("user_security_policies", "iam");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.FaceModeOverride).HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.GpsModeOverride).HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.AttendanceModeOverride).HasConversion<string>().HasMaxLength(50);

        builder.HasIndex(x => x.UserId).IsUnique();
    }
}

public sealed class RegisteredDeviceConfiguration : IEntityTypeConfiguration<RegisteredDevice>
{
    public void Configure(EntityTypeBuilder<RegisteredDevice> builder)
    {
        builder.ToTable("registered_devices", "iam");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.DeviceName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.ApprovedBy).HasMaxLength(100);
        builder.Property(x => x.LastIpAddress).HasMaxLength(50);

        builder.OwnsOne(x => x.Fingerprint, fp =>
        {
            fp.Property(f => f.FingerprintHash).HasColumnName("fingerprint_hash").HasMaxLength(100).IsRequired();
            fp.Property(f => f.ClientType).HasColumnName("client_type").HasMaxLength(50);
            fp.Property(f => f.DeviceModel).HasColumnName("device_model").HasMaxLength(100);
            fp.Property(f => f.OperatingSystem).HasColumnName("operating_system").HasMaxLength(50);
        });

        builder.HasIndex(x => x.UserId);
    }
}

public sealed class SecurityIncidentConfiguration : IEntityTypeConfiguration<SecurityIncident>
{
    public void Configure(EntityTypeBuilder<SecurityIncident> builder)
    {
        builder.ToTable("security_incidents", "iam");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.Severity).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.IpAddress).HasMaxLength(50);
        builder.Property(x => x.ResolutionNotes).HasMaxLength(1000);

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Severity);
        builder.HasIndex(x => x.IsResolved);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class SecurityAuditLogConfiguration : IEntityTypeConfiguration<SecurityAuditLog>
{
    public void Configure(EntityTypeBuilder<SecurityAuditLog> builder)
    {
        builder.ToTable("security_audit_logs", "iam");

        builder.HasKey(sal => sal.Id);
        builder.Property(sal => sal.Id).ValueGeneratedNever();

        builder.Property(sal => sal.Action).HasMaxLength(100).IsRequired();
        builder.Property(sal => sal.Category).HasMaxLength(100).IsRequired();
        builder.Property(sal => sal.EntityName).HasMaxLength(100).IsRequired();
        builder.Property(sal => sal.EntityId).HasMaxLength(100);
        builder.Property(sal => sal.PerformedBy).HasMaxLength(100).IsRequired();
        builder.Property(sal => sal.IpAddress).HasMaxLength(50).IsRequired();
        builder.Property(sal => sal.CorrelationId).HasMaxLength(100);
        builder.Property(sal => sal.RequestId).HasMaxLength(100);
        builder.Property(sal => sal.OldValues).HasMaxLength(4000);
        builder.Property(sal => sal.NewValues).HasMaxLength(4000);

        builder.Property(sal => sal.Username).HasMaxLength(100);
        builder.Property(sal => sal.EmployeeId).HasMaxLength(100);
        builder.Property(sal => sal.EventType).HasMaxLength(100);
        builder.Property(sal => sal.Module).HasMaxLength(100);
        builder.Property(sal => sal.Description).HasMaxLength(1000);
        builder.Property(sal => sal.FailureReason).HasMaxLength(1000);
        builder.Property(sal => sal.Device).HasMaxLength(250);
        builder.Property(sal => sal.Browser).HasMaxLength(250);
        builder.Property(sal => sal.OperatingSystem).HasMaxLength(250);
        builder.Property(sal => sal.Location).HasMaxLength(250);
        builder.Property(sal => sal.Endpoint).HasMaxLength(250);
        builder.Property(sal => sal.HttpMethod).HasMaxLength(20);

        builder.Property(sal => sal.CreatedBy).HasMaxLength(100);
        builder.Property(sal => sal.ModifiedBy).HasMaxLength(100);
        builder.Property(sal => sal.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(sal => !sal.IsDeleted);

        builder.HasIndex(sal => sal.Timestamp).HasDatabaseName("idx_security_audit_logs_timestamp");
        builder.HasIndex(sal => sal.PerformedBy).HasDatabaseName("idx_security_audit_logs_performed_by");
        builder.HasIndex(sal => sal.EventType).HasDatabaseName("idx_security_audit_logs_event_type");
        builder.HasIndex(sal => sal.Category).HasDatabaseName("idx_security_audit_logs_category");
    }
}

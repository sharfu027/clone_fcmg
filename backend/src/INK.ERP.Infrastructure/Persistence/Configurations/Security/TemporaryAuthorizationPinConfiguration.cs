using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Security;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Security;

public class TemporaryAuthorizationPinConfiguration : IEntityTypeConfiguration<TemporaryAuthorizationPin>
{
    public void Configure(EntityTypeBuilder<TemporaryAuthorizationPin> builder)
    {
        builder.ToTable("temporary_authorization_pins", "security");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PinHash).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Purpose).HasMaxLength(50).IsRequired();
        builder.Property(x => x.GeneratedByUserId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.GeneratedByUserName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.UsedByUserId).HasMaxLength(100);
        builder.Property(x => x.IpAddress).HasMaxLength(50);

        builder.HasIndex(x => new { x.CompanyId, x.IsUsed, x.ExpiresAtUtc });
        builder.HasIndex(x => new { x.PinHash, x.IsUsed });

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Employee)
            .WithMany()
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

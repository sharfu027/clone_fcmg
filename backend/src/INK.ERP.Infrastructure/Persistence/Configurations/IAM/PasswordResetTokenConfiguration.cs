using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
        builder.ToTable("password_reset_tokens", "iam");

        builder.HasKey(prt => prt.Id);
        builder.Property(prt => prt.Id).ValueGeneratedNever();

        builder.Property(prt => prt.Token).HasMaxLength(250).IsRequired();
        builder.Property(prt => prt.CreatedBy).HasMaxLength(100);
        builder.Property(prt => prt.ModifiedBy).HasMaxLength(100);
        builder.Property(prt => prt.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(prt => !prt.IsDeleted);

        builder.HasIndex(prt => prt.Token).HasDatabaseName("idx_password_reset_tokens_token");
        builder.HasIndex(prt => prt.UserId).HasDatabaseName("idx_password_reset_tokens_user_id");

        // Relationships
        builder.HasOne(prt => prt.User)
            .WithMany()
            .HasForeignKey(prt => prt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

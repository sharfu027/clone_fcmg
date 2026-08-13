using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class EmailVerificationTokenConfiguration : IEntityTypeConfiguration<EmailVerificationToken>
{
    public void Configure(EntityTypeBuilder<EmailVerificationToken> builder)
    {
        builder.ToTable("email_verification_tokens", "iam");

        builder.HasKey(evt => evt.Id);
        builder.Property(evt => evt.Id).ValueGeneratedNever();

        builder.Property(evt => evt.Token).HasMaxLength(250).IsRequired();
        builder.Property(evt => evt.CreatedBy).HasMaxLength(100);
        builder.Property(evt => evt.ModifiedBy).HasMaxLength(100);
        builder.Property(evt => evt.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(evt => !evt.IsDeleted);

        builder.HasIndex(evt => evt.Token).HasDatabaseName("idx_email_verification_tokens_token");
        builder.HasIndex(evt => evt.UserId).HasDatabaseName("idx_email_verification_tokens_user_id");

        // Relationships
        builder.HasOne(evt => evt.User)
            .WithMany()
            .HasForeignKey(evt => evt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

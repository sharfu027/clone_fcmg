using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.SFA;

namespace INK.ERP.Infrastructure.Persistence.Configurations.SFA;

public class SalesBeatConfiguration : IEntityTypeConfiguration<SalesBeat>
{
    public void Configure(EntityTypeBuilder<SalesBeat> builder)
    {
        builder.ToTable("sales_beats", "sfa");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Frequency).HasMaxLength(30).IsRequired().HasDefaultValue("Daily");
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SalesEmployee)
            .WithMany()
            .HasForeignKey(x => x.SalesEmployeeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Customers)
            .WithOne(x => x.SalesBeat)
            .HasForeignKey(x => x.SalesBeatId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SalesBeatCustomerConfiguration : IEntityTypeConfiguration<SalesBeatCustomer>
{
    public void Configure(EntityTypeBuilder<SalesBeatCustomer> builder)
    {
        builder.ToTable("sales_beat_customers", "sfa");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SequenceOrder).IsRequired().HasDefaultValue(1);

        builder.HasOne(x => x.SalesBeat)
            .WithMany(b => b.Customers)
            .HasForeignKey(x => x.SalesBeatId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SalesRepCustomerAssignmentConfiguration : IEntityTypeConfiguration<SalesRepCustomerAssignment>
{
    public void Configure(EntityTypeBuilder<SalesRepCustomerAssignment> builder)
    {
        builder.ToTable("sales_rep_customer_assignments", "sfa");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Employee)
            .WithMany()
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SalesVisitConfiguration : IEntityTypeConfiguration<SalesVisit>
{
    public void Configure(EntityTypeBuilder<SalesVisit> builder)
    {
        builder.ToTable("sales_visits", "sfa");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Outcome).HasMaxLength(50).IsRequired().HasDefaultValue("Planned");
        builder.Property(x => x.Notes).HasMaxLength(500);

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SalesEmployee)
            .WithMany()
            .HasForeignKey(x => x.SalesEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SalesRepLocationEnrollmentConfiguration : IEntityTypeConfiguration<SalesRepLocationEnrollment>
{
    public void Configure(EntityTypeBuilder<SalesRepLocationEnrollment> builder)
    {
        builder.ToTable("sales_rep_location_enrollments", "sfa");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.LocationName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Latitude).IsRequired();
        builder.Property(x => x.Longitude).IsRequired();
        builder.Property(x => x.AllowedRadiusMeters).IsRequired().HasDefaultValue(50.0);
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.EnrolledAtUtc).IsRequired();

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Employee)
            .WithMany()
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}


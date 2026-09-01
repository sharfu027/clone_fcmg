using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Sales;

public class SalesInvoiceConfiguration : IEntityTypeConfiguration<SalesInvoice>
{
    public void Configure(EntityTypeBuilder<SalesInvoice> builder)
    {
        builder.ToTable("sales_invoices", "sales");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).IsRequired().HasDefaultValue("Draft");
        builder.Property(x => x.PaymentStatus).HasMaxLength(30).IsRequired().HasDefaultValue("Unpaid");
        builder.Property(x => x.EInvoiceStatus).HasMaxLength(30).IsRequired().HasDefaultValue("NotGenerated");

        builder.Property(x => x.Subtotal).HasPrecision(18, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 2);
        builder.Property(x => x.TaxAmount).HasPrecision(18, 2);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.PaidAmount).HasPrecision(18, 2);
        builder.Property(x => x.OutstandingAmount).HasPrecision(18, 2);

        builder.Property(x => x.Irn).HasMaxLength(100);
        builder.Property(x => x.AckNo).HasMaxLength(50);
        builder.Property(x => x.QrCodeData).HasMaxLength(4000);
        builder.Property(x => x.SignedInvoiceData).HasMaxLength(8000);
        builder.Property(x => x.EInvoiceFailureReason).HasMaxLength(500);

        builder.HasIndex(x => new { x.CompanyId, x.InvoiceNumber }).IsUnique();
        builder.HasIndex(x => new { x.CompanyId, x.CustomerId });
        builder.HasIndex(x => new { x.CompanyId, x.SalesOrderId });
        builder.HasIndex(x => new { x.CompanyId, x.Status });
        builder.HasIndex(x => new { x.CompanyId, x.PaymentStatus });

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SalesOrder)
            .WithMany()
            .HasForeignKey(x => x.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Items)
            .WithOne(i => i.SalesInvoice)
            .HasForeignKey(i => i.SalesInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Payments)
            .WithOne(p => p.SalesInvoice)
            .HasForeignKey(p => p.SalesInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SalesInvoiceItemConfiguration : IEntityTypeConfiguration<SalesInvoiceItem>
{
    public void Configure(EntityTypeBuilder<SalesInvoiceItem> builder)
    {
        builder.ToTable("sales_invoice_items", "sales");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Quantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.TaxAmount).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.LineTotal).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.BatchNumber).HasMaxLength(50);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class InvoicePaymentConfiguration : IEntityTypeConfiguration<InvoicePayment>
{
    public void Configure(EntityTypeBuilder<InvoicePayment> builder)
    {
        builder.ToTable("invoice_payments", "sales");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PaymentNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.PaymentMode).HasMaxLength(30).IsRequired().HasDefaultValue("Cash");
        builder.Property(x => x.ReferenceNumber).HasMaxLength(100);
        builder.Property(x => x.Notes).HasMaxLength(500);

        builder.HasIndex(x => new { x.CompanyId, x.PaymentNumber }).IsUnique();
        builder.HasIndex(x => new { x.CompanyId, x.SalesInvoiceId });

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ReceivedByEmployee)
            .WithMany()
            .HasForeignKey(x => x.ReceivedByEmployeeId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class DeliveryTrackingConfiguration : IEntityTypeConfiguration<DeliveryTracking>
{
    public void Configure(EntityTypeBuilder<DeliveryTracking> builder)
    {
        builder.ToTable("delivery_trackings", "sales");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TrackingNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).IsRequired().HasDefaultValue("Dispatched");
        builder.Property(x => x.CarrierName).HasMaxLength(100);
        builder.Property(x => x.VehicleNumber).HasMaxLength(50);
        builder.Property(x => x.DriverName).HasMaxLength(100);
        builder.Property(x => x.DriverPhone).HasMaxLength(30);
        builder.Property(x => x.ReceivedByPerson).HasMaxLength(100);
        builder.Property(x => x.SignatureProofUrl).HasMaxLength(1000);
        builder.Property(x => x.Notes).HasMaxLength(500);

        builder.HasIndex(x => new { x.CompanyId, x.TrackingNumber }).IsUnique();
        builder.HasIndex(x => new { x.CompanyId, x.SalesOrderId });
        builder.HasIndex(x => new { x.CompanyId, x.Status });

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SalesOrder)
            .WithMany()
            .HasForeignKey(x => x.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Dispatch)
            .WithMany()
            .HasForeignKey(x => x.DispatchId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

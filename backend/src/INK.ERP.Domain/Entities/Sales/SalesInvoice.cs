using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Sales;

public static class SalesInvoiceStatuses
{
    public const string Draft = "Draft";
    public const string Issued = "Issued";
    public const string Paid = "Paid";
    public const string PartiallyPaid = "PartiallyPaid";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All = [Draft, Issued, Paid, PartiallyPaid, Cancelled];
}

public static class EInvoiceStatuses
{
    public const string NotGenerated = "NotGenerated";
    public const string Pending = "Pending";
    public const string Generated = "Generated";
    public const string Failed = "Failed";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All = [NotGenerated, Pending, Generated, Failed, Cancelled];
}

public static class PaymentStatuses
{
    public const string Unpaid = "Unpaid";
    public const string PartiallyPaid = "PartiallyPaid";
    public const string Paid = "Paid";
    public const string Overdue = "Overdue";

    public static readonly string[] All = [Unpaid, PartiallyPaid, Paid, Overdue];
}

public sealed class SalesInvoice : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid? DispatchId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Status { get; set; } = SalesInvoiceStatuses.Draft;
    public DateTime InvoiceDateUtc { get; set; } = DateTime.UtcNow;
    public DateTime DueDateUtc { get; set; } = DateTime.UtcNow.AddDays(30);
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public string PaymentStatus { get; set; } = PaymentStatuses.Unpaid;
    public string? PaymentTerms { get; set; }
    public string? Notes { get; set; }

    // E-Invoice Foundation
    public string EInvoiceStatus { get; set; } = EInvoiceStatuses.NotGenerated;
    public string? Irn { get; set; }
    public string? AckNo { get; set; }
    public DateTime? AckDateUtc { get; set; }
    public string? QrCodeData { get; set; }
    public string? SignedInvoiceData { get; set; }
    public string? EInvoiceFailureReason { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public Customer? Customer { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public ICollection<SalesInvoiceItem> Items { get; set; } = new List<SalesInvoiceItem>();
    public ICollection<InvoicePayment> Payments { get; set; } = new List<InvoicePayment>();
}

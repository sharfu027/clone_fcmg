using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Sales;

public static class PaymentModes
{
    public const string Cash = "Cash";
    public const string UPI = "UPI";
    public const string Cheque = "Cheque";
    public const string BankTransfer = "BankTransfer";
    public const string Card = "Card";

    public static readonly string[] All = [Cash, UPI, Cheque, BankTransfer, Card];
}

public sealed class InvoicePayment : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid SalesInvoiceId { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public DateTime PaymentDateUtc { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = PaymentModes.Cash;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public Guid? ReceivedByEmployeeId { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public Employee? ReceivedByEmployee { get; set; }
}

using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Sales;

public sealed class SalesInvoiceItem : BaseEntity
{
    public Guid SalesInvoiceId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public string? BatchNumber { get; set; }

    // Navigation Properties
    public SalesInvoice? SalesInvoice { get; set; }
    public Product? Product { get; set; }
}

using System;
using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.Procurement;

public class RfqItem : AuditableEntity
{
    public Guid RfqId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Uom { get; set; } = "PCS";
    public decimal RequestedQuantity { get; set; }
    public DateTime? RequiredByDate { get; set; }
    public string? Notes { get; set; }

    public virtual Rfq Rfq { get; set; } = null!;
}

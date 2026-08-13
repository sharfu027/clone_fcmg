using System;
using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.Procurement;

public class RfqSupplier : AuditableEntity
{
    public Guid RfqId { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public RfqSupplierRecipientStatus DeliveryStatus { get; set; } = RfqSupplierRecipientStatus.Pending;
    public DateTime? SentAtUtc { get; set; }

    public virtual Rfq Rfq { get; set; } = null!;
}

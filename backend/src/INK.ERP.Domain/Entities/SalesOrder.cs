using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities;

public sealed class SalesOrder : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
}

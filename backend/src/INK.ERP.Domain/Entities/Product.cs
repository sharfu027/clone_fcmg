using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities;

public sealed class Product : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

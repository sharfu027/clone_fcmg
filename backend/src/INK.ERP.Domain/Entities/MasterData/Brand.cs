using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Brand : BaseEntity
{
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ManufacturerName { get; set; }
    public string? OriginCountry { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Property
    public Company? Company { get; set; }
}

using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Domain.Entities;

public sealed class Warehouse : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid? BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string WarehouseType { get; set; } = "Central Warehouse";
    public string Status { get; set; } = "Active";
    public Guid? ManagerEmployeeId { get; set; }
    public Address Address { get; set; } = new();
    public double? CapacitySqFt { get; set; }
    public int? PalletCapacity { get; set; }
    public int? CartonCapacity { get; set; }
    public string? ContactNumber { get; set; }
    public string? Email { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Remarks { get; set; }
    public bool IsTemperatureControlled { get; set; } = false;
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Company? Company { get; set; }
    public Branch? Branch { get; set; }
}

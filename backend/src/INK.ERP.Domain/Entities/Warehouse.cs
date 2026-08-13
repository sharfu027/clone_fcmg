using INK.ERP.Domain.Common;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Domain.Entities;

public sealed class Warehouse : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string WarehouseType { get; set; } = "CentralDepot";
    public Guid? ManagerEmployeeId { get; set; }
    public Address Address { get; set; } = new();
    public double? CapacitySqFt { get; set; }
    public bool IsTemperatureControlled { get; set; } = false;
    public bool IsActive { get; set; } = true;
}

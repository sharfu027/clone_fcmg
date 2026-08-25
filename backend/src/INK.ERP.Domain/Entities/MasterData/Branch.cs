using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Branch : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Gstin { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public Address Address { get; set; } = new();
    public bool IsHeadquarters { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public Guid? ManagerEmployeeId { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public Employee? ManagerEmployee { get; set; }
}

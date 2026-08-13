using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Employee : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid BranchId { get; set; }
    public Guid DepartmentId { get; set; }
    public Guid DesignationId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; } = DateTime.UtcNow.Date;
    public decimal? Salary { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Company? Company { get; set; }
    public Branch? Branch { get; set; }
    public Department? Department { get; set; }
    public Designation? Designation { get; set; }
}

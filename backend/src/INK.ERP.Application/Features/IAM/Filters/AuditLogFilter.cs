using System;

namespace INK.ERP.Application.Features.IAM.Filters;

public class AuditLogFilter
{
    public string? SearchTerm { get; set; }
    public string? Category { get; set; }
    public string? EventType { get; set; }
    public string? Module { get; set; }
    public string? Result { get; set; } // "all" | "success" | "failure"
    public Guid? UserId { get; set; }
    public string? Username { get; set; }
    public string? EmployeeId { get; set; }
    public string? Branch { get; set; }
    public string? Device { get; set; }
    public string? IpAddress { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "timestamp";
    public bool SortDescending { get; set; } = true;
}

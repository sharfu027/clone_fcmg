namespace INK.ERP.Application.Features.MasterData.Employees.DTOs;

public record EmployeeDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    Guid BranchId,
    string? BranchName,
    Guid DepartmentId,
    string? DepartmentName,
    Guid DesignationId,
    string? DesignationTitle,
    string EmployeeCode,
    string FirstName,
    string LastName,
    string FullName,
    string Email,
    string Phone,
    DateTime JoiningDate,
    decimal? Salary,
    bool IsActive,
    DateTime CreatedAtUtc);

namespace INK.ERP.Application.Features.MasterData.Departments.DTOs;

public record DepartmentDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    Guid? BranchId,
    string? BranchName,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    Guid? ManagerEmployeeId,
    string? ManagerEmployeeName,
    string? ManagerEmployeeCode,
    DateTime CreatedAtUtc);

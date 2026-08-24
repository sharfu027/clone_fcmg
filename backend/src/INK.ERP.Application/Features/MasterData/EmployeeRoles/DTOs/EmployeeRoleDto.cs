namespace INK.ERP.Application.Features.MasterData.EmployeeRoles.DTOs;

public record EmployeeRoleDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    DateTime CreatedAtUtc);

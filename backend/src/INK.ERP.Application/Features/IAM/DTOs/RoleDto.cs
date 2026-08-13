namespace INK.ERP.Application.Features.IAM.DTOs;

public sealed record RoleDto(
    Guid Id,
    string Name,
    string Code,
    string Description,
    bool IsSystem,
    int Priority,
    bool IsActive,
    int UsersCount,
    int PermissionCount,
    List<string>? PermissionCodes,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc,
    string? CreatedBy = null,
    string? ModifiedBy = null);

public sealed record RoleStatsDto(
    int TotalRoles,
    int ActiveRoles,
    int InactiveRoles,
    int SystemRoles,
    int CustomRoles,
    int TotalUsersAssigned,
    int TotalPermissionsCount);

public sealed record PermissionCategoryDto(
    Guid Id,
    string Code,
    string Name,
    string Description,
    int DisplayOrder,
    List<PermissionItemDto> Permissions);

public sealed record PermissionItemDto(
    Guid Id,
    string Code,
    string Name,
    string Description,
    string Action,
    int DisplayOrder);

public sealed record RoleUserDto(
    Guid UserId,
    string UserName,
    string DisplayName,
    string Email,
    string? Department,
    string? Branch,
    bool IsActive,
    DateTime? LastLoginUtc);

public sealed record UpdateRolePermissionsRequest(
    List<Guid> PermissionIds);

public sealed record CloneRoleRequest(
    string NewName,
    string NewCode,
    string Description);

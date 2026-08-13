namespace INK.ERP.Application.Features.IAM.DTOs;

public sealed record PermissionDto(
    Guid Id,
    string Name,
    string Code,
    string Description,
    Guid PermissionGroupId,
    string PermissionGroupName,
    int DisplayOrder,
    bool IsActive);

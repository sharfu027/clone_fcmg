namespace INK.ERP.Application.Features.IAM.Filters;

public record UserFilter(
    string? SearchTerm = null,
    bool? IsActive = null,
    bool? IsLocked = null,
    int PageNumber = 1,
    int PageSize = 10,
    string? SortBy = null,
    bool SortDescending = false);

public record RoleFilter(
    string? SearchTerm = null,
    bool? IsActive = null,
    bool? IsSystem = null,
    int PageNumber = 1,
    int PageSize = 10,
    string? SortBy = null,
    bool SortDescending = false);

public record PermissionFilter(
    string? SearchTerm = null,
    Guid? PermissionGroupId = null,
    bool? IsActive = null,
    int PageNumber = 1,
    int PageSize = 10,
    string? SortBy = null,
    bool SortDescending = false);

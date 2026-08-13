using INK.ERP.Application.Common.Specifications;
using INK.ERP.Application.Features.IAM.Filters;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Application.Features.IAM.Specifications;

public class UserFilterSpecification : BaseSpecification<ApplicationUser>
{
    public UserFilterSpecification(UserFilter filter)
        : base(u => 
            (!filter.IsActive.HasValue || u.IsActive == filter.IsActive.Value) &&
            (!filter.IsLocked.HasValue || u.IsLocked == filter.IsLocked.Value) &&
            (string.IsNullOrWhiteSpace(filter.SearchTerm) ||
             (u.UserName != null && u.UserName.Contains(filter.SearchTerm)) ||
             (u.Email != null && u.Email.Contains(filter.SearchTerm)) ||
             (u.DisplayName != null && u.DisplayName.Contains(filter.SearchTerm))))
    {
        if (filter.SortDescending)
        {
            ApplyOrderByDescending(u => u.CreatedAtUtc);
        }
        else
        {
            ApplyOrderBy(u => u.CreatedAtUtc);
        }

        ApplyPaging((filter.PageNumber - 1) * filter.PageSize, filter.PageSize);
    }
}

public class RoleFilterSpecification : BaseSpecification<ApplicationRole>
{
    public RoleFilterSpecification(RoleFilter filter)
        : base(r => !r.IsDeleted &&
            (!filter.IsActive.HasValue || r.IsActive == filter.IsActive.Value) &&
            (!filter.IsSystem.HasValue || r.IsSystem == filter.IsSystem.Value) &&
            (string.IsNullOrWhiteSpace(filter.SearchTerm) ||
             (r.Name != null && r.Name.Contains(filter.SearchTerm)) ||
             (r.Code != null && r.Code.Contains(filter.SearchTerm))))
    {
        if (filter.SortDescending)
        {
            ApplyOrderByDescending(r => r.CreatedAtUtc);
        }
        else
        {
            ApplyOrderBy(r => r.CreatedAtUtc);
        }

        ApplyPaging((filter.PageNumber - 1) * filter.PageSize, filter.PageSize);
    }
}

public class PermissionFilterSpecification : BaseSpecification<Permission>
{
    public PermissionFilterSpecification(PermissionFilter filter)
        : base(p => !p.IsDeleted &&
            (!filter.IsActive.HasValue || p.IsActive == filter.IsActive.Value) &&
            (!filter.PermissionGroupId.HasValue || p.PermissionGroupId == filter.PermissionGroupId.Value) &&
            (string.IsNullOrWhiteSpace(filter.SearchTerm) ||
             (p.Name != null && p.Name.Contains(filter.SearchTerm)) ||
             (p.Code != null && p.Code.Contains(filter.SearchTerm))))
    {
        ApplyOrderBy(p => p.DisplayOrder);
        ApplyPaging((filter.PageNumber - 1) * filter.PageSize, filter.PageSize);
    }
}

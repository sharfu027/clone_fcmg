using INK.ERP.Application.Common.Specifications;
using INK.ERP.Application.Features.IAM.Filters;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Application.Features.IAM.Specifications;

/// <summary>
/// Reusable specification enforcing strict server-side multi-admin scope isolation.
/// - Super Admin: Full visibility across all user accounts.
/// - Admin (Sub-Admin): Can view operational users and self, but CANNOT view Super Admins or other Sub-Admins.
/// </summary>
public class UserScopeSpecification : BaseSpecification<ApplicationUser>
{
    public UserScopeSpecification(UserFilter filter, bool isSuperAdmin, HashSet<Guid> restrictedUserIds)
        : base(u =>
            (!u.IsDeleted) &&
            (isSuperAdmin || restrictedUserIds.Count == 0 || !restrictedUserIds.Contains(u.Id)) &&
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

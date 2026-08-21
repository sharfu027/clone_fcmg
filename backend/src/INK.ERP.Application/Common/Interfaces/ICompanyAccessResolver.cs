using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Common.Interfaces;

public interface ICompanyAccessResolver
{
    /// <summary>
    /// Returns null if the current user is a Super Administrator (unrestricted global access).
    /// Returns the assigned active CompanyId for an Administrator.
    /// Returns Guid.Empty if an Administrator has no assigned Company.
    /// </summary>
    Task<Guid?> GetAuthorizedCompanyIdAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if the current user has the Super Administrator role.
    /// </summary>
    Task<bool> IsSuperAdminAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifies if the current user has access to the specified company.
    /// </summary>
    Task<bool> HasAccessToCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates company access and returns a Result failure if access is denied.
    /// </summary>
    Task<Result<Unit>> ValidateCompanyAccessAsync(Guid companyId, CancellationToken cancellationToken = default);
}

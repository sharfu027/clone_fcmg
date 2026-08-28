using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Common.Interfaces;

public interface ILocationAuthorizationService
{
    /// <summary>
    /// Validates if the current user/employee is authorized for the given location under a specific transfer operation:
    /// "Request" (Destination scope required), "Approve" (Source scope required), "Dispatch" (Source scope required), "Receive" (Destination scope required).
    /// </summary>
    Task<Result<Unit>> AuthorizeLocationAccessAsync(
        Guid companyId,
        Guid locationId,
        string operationType,
        Guid? specificEmployeeId = null,
        CancellationToken cancellationToken = default);
}

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Security;

namespace INK.ERP.Application.Common.Interfaces;

public interface ITemporaryPinRepository : IGenericRepository<TemporaryAuthorizationPin>
{
    Task<TemporaryAuthorizationPin?> GetActivePinByHashAsync(Guid companyId, string pinHash, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TemporaryAuthorizationPin>> ListRecentAsync(Guid companyId, int limit = 20, CancellationToken cancellationToken = default);
}

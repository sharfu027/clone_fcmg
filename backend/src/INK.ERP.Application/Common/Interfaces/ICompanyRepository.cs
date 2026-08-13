using System;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface ICompanyRepository : IGenericRepository<Company>
{
    Task<bool> ExistsCodeAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsGstinAsync(string gstin, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsLegalNameAsync(string legalName, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

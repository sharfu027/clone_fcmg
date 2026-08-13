using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface IBranchRepository : IGenericRepository<Branch>
{
    Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<Branch?> GetHeadquartersAsync(Guid companyId, CancellationToken cancellationToken = default);
}

using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface ICategoryRepository : IGenericRepository<Category>
{
    Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

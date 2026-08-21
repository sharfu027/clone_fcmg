using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface IDepartmentRepository : IGenericRepository<Department>
{
    Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

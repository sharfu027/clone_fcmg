using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface IDepartmentRepository : IGenericRepository<Department>
{
    Task<bool> IsCodeUniqueAsync(Guid branchId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

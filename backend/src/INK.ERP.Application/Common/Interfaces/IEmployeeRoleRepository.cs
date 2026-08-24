using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface IEmployeeRoleRepository : IGenericRepository<EmployeeRole>
{
    Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<EmployeeRole?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeRole>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);
}

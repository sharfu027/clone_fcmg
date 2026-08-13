using INK.ERP.Domain.Entities;

namespace INK.ERP.Application.Common.Interfaces;

public interface IWarehouseRepository : IGenericRepository<Warehouse>
{
    Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

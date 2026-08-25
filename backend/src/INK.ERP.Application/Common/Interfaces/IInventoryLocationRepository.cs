using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Common.Interfaces;

public interface IInventoryLocationRepository : IGenericRepository<InventoryLocation>
{
    Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<string> GenerateNextCodeAsync(Guid companyId, CancellationToken cancellationToken = default);
}

using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface IProductRepository : IGenericRepository<Product>
{
    Task<Product?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> IsSkuUniqueAsync(Guid companyId, string sku, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface ISupplierRepository : IGenericRepository<Supplier>
{
    Task<bool> IsCodeUniqueAsync(Guid companyId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> IsGstinUniqueAsync(Guid companyId, string gstin, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<string> GenerateNextCodeAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<Supplier?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Supplier>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);
}

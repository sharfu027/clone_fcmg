using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Common.Interfaces;

public interface IPriceListRepository : IGenericRepository<PriceList>
{
    Task<bool> IsNameUniqueAsync(Guid companyId, string name, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

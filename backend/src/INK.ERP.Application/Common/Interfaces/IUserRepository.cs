using INK.ERP.Application.Common.Specifications;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Common.Interfaces;

public interface IUserRepository : IGenericRepository<ApplicationUser>
{
    Task<IReadOnlyList<ApplicationUser>> ListWithDeletedAsync(ISpecification<ApplicationUser> spec, CancellationToken cancellationToken = default);
    Task<int> CountWithDeletedAsync(ISpecification<ApplicationUser> spec, CancellationToken cancellationToken = default);
}

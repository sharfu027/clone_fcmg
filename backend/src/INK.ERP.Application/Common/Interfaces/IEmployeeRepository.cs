using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Common.Interfaces;

public interface IEmployeeRepository : IGenericRepository<Employee>
{
    Task<bool> IsEmployeeCodeUniqueAsync(Guid companyId, string employeeCode, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> IsEmailUniqueAsync(string email, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<Employee?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Employee>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);
}

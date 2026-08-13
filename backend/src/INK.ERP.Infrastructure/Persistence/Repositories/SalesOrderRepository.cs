using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Entities;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public sealed class SalesOrderRepository : GenericRepository<SalesOrder>, ISalesOrderRepository
{
    public SalesOrderRepository(AppDbContext context) : base(context)
    {
    }
}

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Common.Interfaces;

public interface IDeliveryTrackingRepository : IGenericRepository<DeliveryTracking>
{
    Task<DeliveryTracking?> GetBySalesOrderIdAsync(Guid companyId, Guid salesOrderId, CancellationToken cancellationToken = default);
    Task<DeliveryTracking?> GetByTrackingNumberAsync(Guid companyId, string trackingNumber, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DeliveryTracking>> ListAsync(
        Guid? companyId = null,
        Guid? salesOrderId = null,
        string? status = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);
    Task<string> GetNextTrackingNumberAsync(Guid companyId, CancellationToken cancellationToken = default);
}

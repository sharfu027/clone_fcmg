using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Common.Interfaces;

public interface IInventoryReservationRepository
{
    Task<InventoryReservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<InventoryReservation?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryReservation>> ListAsync(
        Guid? companyId = null,
        Guid? inventoryLocationId = null,
        Guid? productId = null,
        string? status = null,
        Guid? salesOrderId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryReservation>> GetActiveReservationsForProductAndLocationAsync(
        Guid companyId,
        Guid inventoryLocationId,
        Guid productId,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryReservation>> GetExpiredActiveReservationsAsync(
        Guid companyId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);
    Task AddAsync(InventoryReservation reservation, CancellationToken cancellationToken = default);
    Task UpdateAsync(InventoryReservation reservation, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

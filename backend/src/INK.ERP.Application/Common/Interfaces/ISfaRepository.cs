using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.SFA;

namespace INK.ERP.Application.Common.Interfaces;

public interface ISfaRepository
{
    // Sales Reps
    Task<IReadOnlyList<Employee>> GetSalesRepsAsync(List<Guid> companyIds, string? search = null, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, int>> GetAssignmentCountsAsync(List<Guid> employeeIds, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, int>> GetBeatCountsAsync(List<Guid> employeeIds, CancellationToken cancellationToken = default);

    // Beats
    Task<IReadOnlyList<SalesBeat>> GetSalesBeatsAsync(List<Guid> companyIds, Guid? salesEmployeeId = null, string? search = null, CancellationToken cancellationToken = default);
    Task<SalesBeat?> GetSalesBeatByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddSalesBeatAsync(SalesBeat beat, CancellationToken cancellationToken = default);
    Task UpdateSalesBeatAsync(SalesBeat beat, CancellationToken cancellationToken = default);

    // Customer Assignments
    Task<IReadOnlyList<SalesRepCustomerAssignment>> GetCustomerAssignmentsAsync(List<Guid> companyIds, Guid? employeeId = null, Guid? customerId = null, CancellationToken cancellationToken = default);
    Task<SalesRepCustomerAssignment?> GetCustomerAssignmentByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SalesRepCustomerAssignment?> GetActiveAssignmentAsync(Guid companyId, Guid employeeId, Guid customerId, CancellationToken cancellationToken = default);
    Task AddCustomerAssignmentAsync(SalesRepCustomerAssignment assignment, CancellationToken cancellationToken = default);
    Task UpdateCustomerAssignmentAsync(SalesRepCustomerAssignment assignment, CancellationToken cancellationToken = default);

    // Visits
    Task<IReadOnlyList<SalesVisit>> GetSalesVisitsAsync(List<Guid> companyIds, Guid? salesEmployeeId = null, Guid? customerId = null, DateTime? fromDate = null, DateTime? toDate = null, string? outcome = null, CancellationToken cancellationToken = default);
    Task<SalesVisit?> GetSalesVisitByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddSalesVisitAsync(SalesVisit visit, CancellationToken cancellationToken = default);
    Task UpdateSalesVisitAsync(SalesVisit visit, CancellationToken cancellationToken = default);

    // Dashboard
    Task<(int TotalVisits, int CompletedVisits, int OrdersCount, decimal OrdersValue, int GpsVerifiedVisits)> GetDashboardMetricsAsync(List<Guid> companyIds, Guid? salesEmployeeId = null, CancellationToken cancellationToken = default);

    // Location Enrollments
    Task<SalesRepLocationEnrollment?> GetLocationEnrollmentAsync(Guid employeeId, CancellationToken cancellationToken = default);
    Task<SalesRepLocationEnrollment?> GetLocationEnrollmentByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddLocationEnrollmentAsync(SalesRepLocationEnrollment enrollment, CancellationToken cancellationToken = default);
    Task UpdateLocationEnrollmentAsync(SalesRepLocationEnrollment enrollment, CancellationToken cancellationToken = default);
    Task DeleteLocationEnrollmentAsync(SalesRepLocationEnrollment enrollment, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, bool>> GetLocationEnrollmentStatusAsync(List<Guid> employeeIds, CancellationToken cancellationToken = default);

    // Save
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}


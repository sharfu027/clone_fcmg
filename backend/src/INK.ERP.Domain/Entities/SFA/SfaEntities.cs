using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.SFA;

public sealed class SalesBeat : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public Guid? SalesEmployeeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Frequency { get; set; } = "Daily"; // Daily, Weekly, BiWeekly
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Company? Company { get; set; }
    public Employee? SalesEmployee { get; set; }
    public List<SalesBeatCustomer> Customers { get; set; } = new();
}

public sealed class SalesBeatCustomer : AuditableEntity
{
    public Guid SalesBeatId { get; set; }
    public Guid CustomerId { get; set; }
    public int SequenceOrder { get; set; }

    // Navigation Properties
    public SalesBeat? SalesBeat { get; set; }
    public Customer? Customer { get; set; }
}

public sealed class SalesRepCustomerAssignment : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid CustomerId { get; set; }
    public DateTime AssignedFromUtc { get; set; } = DateTime.UtcNow;
    public DateTime? AssignedToUtc { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Company? Company { get; set; }
    public Employee? Employee { get; set; }
    public Customer? Customer { get; set; }
}

public sealed class SalesVisit : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public Guid SalesEmployeeId { get; set; }
    public Guid CustomerId { get; set; }
    public DateTime VisitDateUtc { get; set; } = DateTime.UtcNow.Date;
    public double CheckInLatitude { get; set; }
    public double CheckInLongitude { get; set; }
    public double DistanceToCustomerMeters { get; set; }
    public bool IsGpsVerified { get; set; }
    public bool IsFaceVerified { get; set; }
    public DateTime CheckInAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CheckOutAtUtc { get; set; }
    public string Outcome { get; set; } = "Planned"; // Planned, OrderBooked, NoOrder, StoreClosed, CollectionDone
    public string? Notes { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public Employee? SalesEmployee { get; set; }
    public Customer? Customer { get; set; }
}

using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Enums.MasterData;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Company : BaseEntity
{
    public Guid? TenantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string? TradeName { get; set; }
    public string TaxRegistrationNumber { get; set; } = string.Empty; // GSTIN
    public string PanNumber { get; set; } = string.Empty;
    public string? CinNumber { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    
    public Guid? CurrencyId { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    
    public int FinancialYearStartMonth { get; set; } = 4; // April
    public string TimeZoneId { get; set; } = "Asia/Kolkata";
    
    public Address Address { get; set; } = new();
    
    public CompanyStatus Status { get; set; } = CompanyStatus.Active;
    public bool IsActive { get; set; } = true;
    
    // Enterprise Audit Fields
    public string? CreatedBy { get; set; }
    public string? LastModifiedBy { get; set; }
    public string? DeletedBy { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public bool IsDeleted { get; set; } = false;
    
    // PostgreSQL EF Core xmin RowVersion Concurrency Token
    public uint RowVersion { get; set; }
}

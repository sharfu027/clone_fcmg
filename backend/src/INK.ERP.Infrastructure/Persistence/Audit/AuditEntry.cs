namespace INK.ERP.Infrastructure.Persistence.Audit;

public sealed class AuditEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TableName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // INSERT, UPDATE, DELETE
    public string KeyValues { get; set; } = string.Empty; // JSON
    public string OldValues { get; set; } = string.Empty; // JSON
    public string NewValues { get; set; } = string.Empty; // JSON
    
    // Advanced Audit Fields
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public string? CorrelationId { get; set; }
    public string? RequestId { get; set; }
    public string? IpAddress { get; set; }
    public string MachineName { get; set; } = Environment.MachineName;
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}

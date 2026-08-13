using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace INK.ERP.Domain.Common;

public sealed class ApplicationRole : IdentityRole<Guid>
{
    private readonly List<IDomainEvent> _domainEvents = new();

    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsSystem { get; set; } = false;
    public int Priority { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    // Audit Fields
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastModifiedAtUtc { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    // Soft Delete
    public bool IsDeleted { get; set; } = false;

    // Concurrency Token
    public string ConcurrencyToken { get; set; } = Guid.NewGuid().ToString();

    [NotMapped]
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void RemoveDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Remove(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}

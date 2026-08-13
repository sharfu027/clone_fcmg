using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace INK.ERP.Domain.Common;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    private readonly List<IDomainEvent> _domainEvents = new();

    public Guid? EmployeeId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; } = false;
    public DateTime? LastLoginUtc { get; set; }
    public DateTime? LastPasswordChangedUtc { get; set; }
    public bool RequirePasswordChange { get; set; } = false;
    public string PreferredLanguage { get; set; } = "en";
    public string TimeZone { get; set; } = "UTC";
    public string? ProfileImageUrl { get; set; }

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

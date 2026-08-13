namespace INK.ERP.Domain.Common;

public abstract class BaseDomainEvent : IDomainEvent
{
    public DateTime TriggeredAtUtc { get; } = DateTime.UtcNow;
}

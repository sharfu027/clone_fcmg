using MediatR;

namespace INK.ERP.Domain.Common;

public interface IDomainEvent : INotification
{
    DateTime TriggeredAtUtc { get; }
}

using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Events.IAM;

public sealed class UserCreatedEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public string Username { get; }

    public UserCreatedEvent(Guid userId, string username)
    {
        UserId = userId;
        Username = username;
    }
}

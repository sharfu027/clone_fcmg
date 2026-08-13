using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Events.IAM;

public sealed class UserUpdatedEvent : BaseDomainEvent
{
    public Guid UserId { get; }

    public UserUpdatedEvent(Guid userId)
    {
        UserId = userId;
    }
}

public sealed class UserLockedEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public string LockedBy { get; }

    public UserLockedEvent(Guid userId, string lockedBy)
    {
        UserId = userId;
        LockedBy = lockedBy;
    }
}

public sealed class UserUnlockedEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public string UnlockedBy { get; }

    public UserUnlockedEvent(Guid userId, string unlockedBy)
    {
        UserId = userId;
        UnlockedBy = unlockedBy;
    }
}

public sealed class UserDeactivatedEvent : BaseDomainEvent
{
    public Guid UserId { get; }

    public UserDeactivatedEvent(Guid userId)
    {
        UserId = userId;
    }
}

public sealed class UserActivatedEvent : BaseDomainEvent
{
    public Guid UserId { get; }

    public UserActivatedEvent(Guid userId)
    {
        UserId = userId;
    }
}

public sealed class RoleAssignedEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public Guid RoleId { get; }
    public string RoleName { get; }

    public RoleAssignedEvent(Guid userId, Guid roleId, string roleName)
    {
        UserId = userId;
        RoleId = roleId;
        RoleName = roleName;
    }
}

public sealed class RoleRemovedEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public Guid RoleId { get; }
    public string RoleName { get; }

    public RoleRemovedEvent(Guid userId, Guid roleId, string roleName)
    {
        UserId = userId;
        RoleId = roleId;
        RoleName = roleName;
    }
}

public sealed class PasswordChangedEvent : BaseDomainEvent
{
    public Guid UserId { get; }

    public PasswordChangedEvent(Guid userId)
    {
        UserId = userId;
    }
}

public sealed class PermissionCreatedEvent : BaseDomainEvent
{
    public Guid PermissionId { get; }
    public string Code { get; }

    public PermissionCreatedEvent(Guid permissionId, string code)
    {
        PermissionId = permissionId;
        Code = code;
    }
}

public sealed class PermissionUpdatedEvent : BaseDomainEvent
{
    public Guid PermissionId { get; }

    public PermissionUpdatedEvent(Guid permissionId)
    {
        PermissionId = permissionId;
    }
}

public sealed class PermissionDeletedEvent : BaseDomainEvent
{
    public Guid PermissionId { get; }
    public string Code { get; }

    public PermissionDeletedEvent(Guid permissionId, string code)
    {
        PermissionId = permissionId;
        Code = code;
    }
}

public sealed class RoleCreatedEvent : BaseDomainEvent
{
    public Guid RoleId { get; }
    public string Code { get; }

    public RoleCreatedEvent(Guid roleId, string code)
    {
        RoleId = roleId;
        Code = code;
    }
}

public sealed class RoleUpdatedEvent : BaseDomainEvent
{
    public Guid RoleId { get; }

    public RoleUpdatedEvent(Guid roleId)
    {
        RoleId = roleId;
    }
}

public sealed class RoleDeletedEvent : BaseDomainEvent
{
    public Guid RoleId { get; }
    public string Code { get; }

    public RoleDeletedEvent(Guid roleId, string code)
    {
        RoleId = roleId;
        Code = code;
    }
}

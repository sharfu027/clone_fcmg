using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.IAM;

public static class IamErrors
{
    public static class User
    {
        public static Error NotFound(Guid id) => 
            new("IAM.USER.NOT_FOUND", $"User with ID '{id}' was not found.", ErrorType.NotFound);

        public static Error UsernameAlreadyExists(string username) => 
            new("IAM.USER.DUPLICATE_USERNAME", $"Username '{username}' is already taken.", ErrorType.Conflict);

        public static Error EmailAlreadyExists(string email) => 
            new("IAM.USER.DUPLICATE_EMAIL", $"Email '{email}' is already registered.", ErrorType.Conflict);

        public static readonly Error CannotDeactivateLastAdmin = 
            new("IAM.USER.CANNOT_DEACTIVATE_LAST_ADMIN", "Cannot deactivate the last administrator.", ErrorType.Failure);

        public static readonly Error CannotLockSelf = 
            new("IAM.USER.CANNOT_LOCK_SELF", "You cannot lock your own account.", ErrorType.Failure);

        public static readonly Error InactiveCannotReceiveRoles = 
            new("IAM.USER.INACTIVE_ROLE_ASSIGNMENT", "Cannot assign roles to an inactive user.", ErrorType.Failure);

        public static readonly Error PasswordPolicyViolation = 
            new("IAM.USER.PASSWORD_POLICY_VIOLATION", "Password does not meet the required policy.", ErrorType.Validation);

        public static readonly Error CurrentPasswordIncorrect = 
            new("IAM.USER.CURRENT_PASSWORD_INCORRECT", "The current password is incorrect.", ErrorType.Validation);
    }

    public static class Role
    {
        public static Error NotFound(Guid id) => 
            new("IAM.ROLE.NOT_FOUND", $"Role with ID '{id}' was not found.", ErrorType.NotFound);

        public static Error CodeAlreadyExists(string code) => 
            new("IAM.ROLE.DUPLICATE_CODE", $"Role code '{code}' already exists.", ErrorType.Conflict);

        public static readonly Error CannotDeleteSystemRole = 
            new("IAM.ROLE.SYSTEM_ROLE_CANNOT_BE_DELETED", "Cannot delete a system role.", ErrorType.Failure);

        public static readonly Error CannotRemoveLastAdminRole = 
            new("IAM.ROLE.CANNOT_REMOVE_LAST_ADMIN", "Cannot remove the last administrator role assignment.", ErrorType.Failure);

        public static Error DuplicateAssignment(string roleName) => 
            new("IAM.ROLE.DUPLICATE_ASSIGNMENT", $"User already has role '{roleName}'.", ErrorType.Conflict);
    }

    public static class Permission
    {
        public static Error NotFound(Guid id) => 
            new("IAM.PERMISSION.NOT_FOUND", $"Permission with ID '{id}' was not found.", ErrorType.NotFound);

        public static Error CodeAlreadyExists(string code) => 
            new("IAM.PERMISSION.DUPLICATE_CODE", $"Permission code '{code}' already exists.", ErrorType.Conflict);

        public static Error GroupNotFound(Guid id) => 
            new("IAM.PERMISSION.GROUP_NOT_FOUND", $"Permission group with ID '{id}' was not found.", ErrorType.NotFound);
    }
}

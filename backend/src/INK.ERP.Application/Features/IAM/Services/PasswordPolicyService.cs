using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.IAM.Services;

public interface IPasswordPolicyService
{
    Result ValidatePassword(string password);
}

public class PasswordPolicyService : IPasswordPolicyService
{
    public Result ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            return Result.Failure(IamErrors.User.PasswordPolicyViolation);
        }

        if (password.Length < 8)
        {
            return Result.Failure(IamErrors.User.PasswordPolicyViolation);
        }

        if (!password.Any(char.IsUpper))
        {
            return Result.Failure(IamErrors.User.PasswordPolicyViolation);
        }

        if (!password.Any(char.IsLower))
        {
            return Result.Failure(IamErrors.User.PasswordPolicyViolation);
        }

        if (!password.Any(char.IsDigit))
        {
            return Result.Failure(IamErrors.User.PasswordPolicyViolation);
        }

        return Result.Success();
    }
}

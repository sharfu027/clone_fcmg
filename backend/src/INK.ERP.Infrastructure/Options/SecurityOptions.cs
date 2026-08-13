using System.ComponentModel.DataAnnotations;

namespace INK.ERP.Infrastructure.Options;

public sealed class SecurityOptions
{
    public const string SectionName = "Security";

    public bool RequireConfirmedAccount { get; set; } = false;

    [Range(1, 90)]
    public int RefreshTokenExpiryDays { get; set; } = 7;

    public bool EnableTokenFamilyRotation { get; set; } = true;
    public bool EnableIpBindingCheck { get; set; } = true;
}

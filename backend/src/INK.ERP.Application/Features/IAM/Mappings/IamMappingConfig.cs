using Mapster;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Application.Features.IAM.DTOs;

namespace INK.ERP.Application.Features.IAM.Mappings;

public sealed class IamMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<ApplicationUser, UserDto>()
            .Map(dest => dest.Roles, src => new List<string>());

        config.NewConfig<ApplicationRole, RoleDto>();

        config.NewConfig<Permission, PermissionDto>()
            .Map(dest => dest.PermissionGroupName, src => src.PermissionGroup != null ? src.PermissionGroup.Name : string.Empty);

        config.NewConfig<UserSession, UserSessionDto>();

        config.NewConfig<LoginHistory, LoginHistoryDto>();

        config.NewConfig<UserPreference, UserPreferenceDto>();
    }
}

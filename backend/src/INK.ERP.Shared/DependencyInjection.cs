namespace INK.ERP.Shared;

using Microsoft.Extensions.DependencyInjection;
using INK.ERP.Shared.Interfaces;
using INK.ERP.Shared.Services;

public static class DependencyInjection
{
    public static IServiceCollection AddSharedServices(this IServiceCollection services)
    {
        services.AddSingleton<IDateTime, DateTimeService>();
        return services;
    }
}

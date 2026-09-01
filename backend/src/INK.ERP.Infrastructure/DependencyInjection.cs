using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using Hangfire;
using Hangfire.PostgreSql;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Infrastructure.Options;
using INK.ERP.Infrastructure.Persistence.Repositories;
using INK.ERP.Infrastructure.Persistence.Repositories.Security;
using INK.ERP.Infrastructure.Persistence.Repositories.SFA;
using INK.ERP.Infrastructure.Persistence.Outbox;
using INK.ERP.Infrastructure.Services;
using INK.ERP.Infrastructure.Security;
using INK.ERP.Infrastructure.Security.Face;
using INK.ERP.Infrastructure.Security.GPS;
using INK.ERP.Infrastructure.Security.Devices;
using INK.ERP.Infrastructure.Security.Risk;
using INK.ERP.Infrastructure.Security.Health;
using INK.ERP.Persistence;
using OpenTelemetry.Trace;

namespace INK.ERP.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Register and Validate Configuration Options
        services.AddOptions<DatabaseOptions>()
            .Bind(configuration.GetSection(DatabaseOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<PasswordPolicyOptions>()
            .Bind(configuration.GetSection(PasswordPolicyOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<SecurityOptions>()
            .Bind(configuration.GetSection(SecurityOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<RedisOptions>()
            .Bind(configuration.GetSection(RedisOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<HangfireOptions>()
            .Bind(configuration.GetSection(HangfireOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<OpenTelemetryOptions>()
            .Bind(configuration.GetSection(OpenTelemetryOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<ApplicationOptions>()
            .Bind(configuration.GetSection(ApplicationOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Register Enterprise Security Options
        services.AddOptions<FaceRecognitionOptions>()
            .Bind(configuration.GetSection(FaceRecognitionOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<OnnxOptions>()
            .Bind(configuration.GetSection(OnnxOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<EncryptionOptions>()
            .Bind(configuration.GetSection(EncryptionOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<GpsOptions>()
            .Bind(configuration.GetSection(GpsOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<SecurityRiskOptions>()
            .Bind(configuration.GetSection(SecurityRiskOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        var databaseOptions = configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>() ?? new DatabaseOptions();
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var redisOptions = configuration.GetSection(RedisOptions.SectionName).Get<RedisOptions>() ?? new RedisOptions();
        var hangfireOptions = configuration.GetSection(HangfireOptions.SectionName).Get<HangfireOptions>() ?? new HangfireOptions();

        // 2. Configure EF Core & PostgreSQL Database
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(databaseOptions.ConnectionString, npgsqlOptions =>
            {
                npgsqlOptions.CommandTimeout(databaseOptions.CommandTimeoutSeconds);
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: databaseOptions.MaxRetryCount,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null);
                npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "iam");
            });

            options.ConfigureWarnings(warnings =>
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));

            if (databaseOptions.EnableSensitiveDataLogging)
            {
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
            }
        });

        // 3. Configure ASP.NET Identity
        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;

            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;

            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        // 4. Configure JWT Authentication & Token Validation
        var jwtKey = Encoding.UTF8.GetBytes(jwtOptions.Secret);
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false; // Turn on for Production
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                    var userIdClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? context.Principal?.FindFirst("sub")?.Value
                        ?? context.Principal?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
                    if (Guid.TryParse(userIdClaim, out var userId))
                    {
                        var userExists = await dbContext.Users.AnyAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);
                        if (!userExists)
                        {
                            context.Fail("User does not exist or is inactive/deleted.");
                        }
                    }
                    else
                    {
                        context.Fail("Invalid user ID in token.");
                    }
                }
            };
        });

        // 5. Configure Redis Caching with fast fallback when local daemon is absent
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = $"{redisOptions.ConnectionString},abortConnect=false,connectTimeout=500";
            options.InstanceName = redisOptions.InstanceName;
        });

        // 6. Configure Hangfire Background Job Processing with PostgreSQL Storage (fallback to InMemory when database offline)
        services.AddHangfire(config =>
        {
            config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                  .UseSimpleAssemblyNameTypeSerializer()
                  .UseRecommendedSerializerSettings();

            bool canConnectToPostgres = false;
            try
            {
                using var conn = new Npgsql.NpgsqlConnection(hangfireOptions.ConnectionString);
                conn.Open();
                canConnectToPostgres = true;
            }
            catch
            {
                canConnectToPostgres = false;
            }

            if (canConnectToPostgres)
            {
                config.UsePostgreSqlStorage(options =>
                {
                    options.UseNpgsqlConnection(hangfireOptions.ConnectionString);
                }, new PostgreSqlStorageOptions
                {
                    SchemaName = hangfireOptions.SchemaName,
                    PrepareSchemaIfNecessary = true
                });
            }
            else
            {
                config.UseInMemoryStorage();
            }
        });

        services.AddHangfireServer();

        // 7. Register System Services & Abstractions
        services.AddSingleton<IDateTime, SystemDateTime>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IPermissionResolver, PermissionResolver>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ICompanyAccessResolver, CompanyAccessResolver>();
        services.AddScoped<ILocationAuthorizationService, LocationAuthorizationService>();

        // Register Enterprise Security Model Loader (Singleton)
        services.AddSingleton<IModelLoader, ModelLoader>();

        // Register Image Processing Pipeline & Stages
        services.AddScoped<IImagePipelineStage, FaceDetectionStage>();
        services.AddScoped<IImagePipelineStage, FaceAlignmentStage>();
        services.AddScoped<IImagePipelineStage, ImageNormalizationStage>();
        services.AddScoped<IImagePipelineStage, ImageQualityCheckStage>();
        services.AddScoped<IImagePipeline, ImagePipeline>();
        services.AddScoped<IImagePreprocessingService, ImagePreprocessingService>();

        // Register Comparison Strategy Engine (Exact Euclidean Distance Matching)
        services.AddScoped<IFaceComparisonStrategy, EuclideanStrategy>();
        services.AddScoped<IFaceComparisonService, FaceComparisonService>();

        // Register AI Security Services (Scoped)
        services.AddScoped<ILivenessDetectionService, LivenessDetectionService>();
        services.AddScoped<IImageQualityService, ImageQualityService>();
        services.AddScoped<IFaceTemplateProtectionService, FaceTemplateProtectionService>();
        services.AddScoped<IFaceEmbeddingService, FaceEmbeddingService>();

        // Register Enterprise Security GPS, Geofence, Device Services (Scoped)
        services.AddScoped<IGpsVerificationService, GpsVerificationService>();
        services.AddScoped<IGeofenceService, GeofenceService>();
        services.AddScoped<IDeviceFingerprintService, DeviceFingerprintService>();
        services.AddSingleton<ISessionRevocationService, SessionRevocationService>();

        // Register Risk Evaluation Strategy Registry & Engine
        services.AddScoped<IRiskStrategy, FaceRiskStrategy>();
        services.AddScoped<IRiskStrategy, GpsRiskStrategy>();
        services.AddScoped<IRiskStrategy, DeviceRiskStrategy>();
        services.AddScoped<IRiskStrategy, BehaviorRiskStrategy>();
        services.AddScoped<IRiskStrategy, PolicyRiskStrategy>();
        services.AddScoped<IRiskEngine, RiskEngine>();

        // 8. Register Repositories & Unit of Work
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IGenericRepository<ApplicationUser>, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUserSessionRepository, UserSessionRepository>();
        services.AddScoped<ILoginHistoryRepository, LoginHistoryRepository>();
        services.AddScoped<ISecurityAuditRepository, SecurityAuditRepository>();

        // Register Enterprise Security Repositories
        services.AddScoped<IFaceProfileRepository, FaceProfileRepository>();
        services.AddScoped<ISecurityPolicyRepository, SecurityPolicyRepository>();
        services.AddScoped<IUserSecurityPolicyRepository, UserSecurityPolicyRepository>();
        services.AddScoped<IRegisteredDeviceRepository, RegisteredDeviceRepository>();
        services.AddScoped<ISecurityIncidentRepository, SecurityIncidentRepository>();

        services.AddScoped<IWarehouseRepository, WarehouseRepository>();
        services.AddScoped<IInventoryLocationRepository, InventoryLocationRepository>();
        services.AddScoped<IInventoryBalanceRepository, InventoryBalanceRepository>();
        services.AddScoped<IInventoryStockPolicyRepository, InventoryStockPolicyRepository>();
        services.AddScoped<IInventoryTransactionRepository, InventoryTransactionRepository>();
        services.AddScoped<IInventoryReservationRepository, InventoryReservationRepository>();
        services.AddScoped<ISalesOrderRepository, SalesOrderRepository>();
        services.AddScoped<IStockTransferRepository, StockTransferRepository>();
        services.AddScoped<IPickTaskRepository, PickTaskRepository>();
        services.AddScoped<IPackTaskRepository, PackTaskRepository>();
        services.AddScoped<IDispatchRepository, DispatchRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<IBranchRepository, BranchRepository>();
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<IDesignationRepository, DesignationRepository>();
        services.AddScoped<IEmployeeRoleRepository, EmployeeRoleRepository>();
        services.AddScoped<IUnitOfMeasureRepository, UnitOfMeasureRepository>();
        services.AddScoped<IBrandRepository, BrandRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ISupplierRepository, SupplierRepository>();
        services.AddScoped<IPurchaseRequisitionRepository, PurchaseRequisitionRepository>();
        services.AddScoped<IRfqRepository, RfqRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IEmployeeRepository, EmployeeRepository>();
        services.AddScoped<IPriceListRepository, PriceListRepository>();
        services.AddScoped<ICustomerPriceRepository, CustomerPriceRepository>();
        services.AddScoped<IDiscountRuleRepository, DiscountRuleRepository>();
        services.AddScoped<IPricingResolutionService, PricingResolutionService>();
        services.AddScoped<IDiscountCalculationService, DiscountCalculationService>();
        services.AddScoped<ISfaRepository, SfaRepository>();

        // 9. Register Current User Abstraction & Context Accessor
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // 10. Register Outbox Processor Background Service
        services.AddHostedService<OutboxProcessor>();

        // 11. Configure Enterprise Health Checks
        services.AddHealthChecks()
            .AddNpgSql(databaseOptions.ConnectionString, name: "PostgreSQL")
            .AddRedis(redisOptions.ConnectionString, name: "Redis")
            .AddHangfire(options =>
            {
                options.MinimumAvailableServers = 1;
            }, name: "Hangfire")
            .AddCheck<FaceModelHealthCheck>("FaceModel")
            .AddCheck<EncryptionHealthCheck>("Encryption")
            .AddCheck<RiskEngineHealthCheck>("RiskEngine")
            .AddCheck<OnnxRuntimeHealthCheck>("OnnxRuntime")
            .AddCheck<GpsHealthCheck>("GpsVerification");

        // 12. Configure OpenTelemetry Tracing
        var enableTracing = configuration.GetValue<bool>("OpenTelemetry:EnableTracing", false);
        if (enableTracing)
        {
            services.AddOpenTelemetry()
                .WithTracing(tracing => tracing
                    .AddAspNetCoreInstrumentation()
                    .AddEntityFrameworkCoreInstrumentation()
                    .AddHttpClientInstrumentation());
        }

        // 13. Register StackExchange.Redis ConnectionMultiplexer
        services.AddSingleton<IConnectionMultiplexer>(sp => 
        {
            var options = ConfigurationOptions.Parse(redisOptions.ConnectionString);
            options.AbortOnConnectFail = false;
            options.ConnectTimeout = 3000;
            return ConnectionMultiplexer.Connect(options);
        });

        // 14. Register Caching, File Storage, and Distributed Lock Services
        services.AddMemoryCache();
        services.AddScoped<ICacheService, RedisCacheService>();
        services.AddScoped<IDistributedLockService, RedisDistributedLockService>();
        services.AddScoped<IPostgresAdvisoryLockService, PostgresAdvisoryLockService>();
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();

        // 15. Register Idempotency Store
        services.AddScoped<IIdempotencyStore, RedisIdempotencyStore>();

        return services;
    }
}

using INK.ERP.API.Middleware;
using INK.ERP.API.OpenApi;
using INK.ERP.Application;
using INK.ERP.Infrastructure;
using INK.ERP.Shared;
using Serilog;
using Asp.Versioning;
using Hangfire;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Serilog Logging
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// 2. Configure Clean Architecture Layer Dependency Injections
builder.Services.AddSharedServices();
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 3. Configure API Controllers, Response Caching, ProblemDetails & Exception Handler
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddResponseCaching();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// 4. Configure API Versioning & Lifecycle
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// 5. Configure Policy-based Authorization
builder.Services.AddAuthorization(options =>
{
    Func<Microsoft.AspNetCore.Authorization.AuthorizationHandlerContext, bool> isSuperOrAdmin = ctx =>
        (ctx.User.Identity != null && ctx.User.Identity.IsAuthenticated) &&
        (ctx.User.IsInRole("Super Administrator") ||
         ctx.User.IsInRole("Administrator") ||
         ctx.User.HasClaim("permission", "manage:all") ||
         ctx.User.HasClaim("permission", "iam:manage") ||
         ctx.User.HasClaim("permission", "manage:security"));

    options.AddPolicy("IAM.Users.Read", policy => 
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "users:read")));

    options.AddPolicy("IAM.Users.Create", policy => 
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "users:create")));

    options.AddPolicy("IAM.Users.Update", policy => 
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "users:update")));

    options.AddPolicy("IAM.Users.Delete", policy => 
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "users:delete")));

    options.AddPolicy("IAM.Roles.Read", policy => 
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "roles:read")));

    options.AddPolicy("IAM.Roles.Manage", policy => 
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "roles:manage")));

    options.AddPolicy("IAM.Permissions.Manage", policy => 
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "permissions:manage")));

    options.AddPolicy("IAM.Audit.Read", policy => 
        policy.RequireAuthenticatedUser());

    // Enterprise Security Policies
    options.AddPolicy("Security.Face.Enroll", policy =>
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "security.face:enroll")));

    options.AddPolicy("Security.Face.Verify", policy =>
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "security.face:verify")));

    options.AddPolicy("Security.Device.Manage", policy =>
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "security.device:manage")));

    options.AddPolicy("Security.Policy.Manage", policy =>
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "security.policy:manage")));

    options.AddPolicy("Security.Risk.View", policy =>
        policy.RequireAssertion(ctx => isSuperOrAdmin(ctx) || ctx.User.HasClaim("permission", "security.risk:view")));

    // Master Data Sub-Module Dual-Check Policies
    Func<Microsoft.AspNetCore.Authorization.AuthorizationHandlerContext, bool> isRootSuper = ctx =>
        (ctx.User.Identity != null && ctx.User.Identity.IsAuthenticated) &&
        (ctx.User.IsInRole("Super Administrator") ||
         ctx.User.HasClaim("permission", "manage:all"));

    Func<Microsoft.AspNetCore.Authorization.AuthorizationHandlerContext, string, bool> hasMasterSubmodule = (ctx, subCode) =>
        isRootSuper(ctx) ||
        (ctx.User.HasClaim("permission", "masters:manage") && ctx.User.HasClaim("permission", subCode));

    options.AddPolicy("Masters.Company", policy =>
        policy.RequireAssertion(ctx => hasMasterSubmodule(ctx, "masters:company")));
    options.AddPolicy("Masters.Companies.Create", policy =>
        policy.RequireAssertion(ctx => isRootSuper(ctx)));
    options.AddPolicy("Masters.Companies.Update", policy =>
        policy.RequireAssertion(ctx => isRootSuper(ctx)));
    options.AddPolicy("Masters.Companies.Archive", policy =>
        policy.RequireAssertion(ctx => isRootSuper(ctx)));
    options.AddPolicy("Masters.Companies.Restore", policy =>
        policy.RequireAssertion(ctx => isRootSuper(ctx)));
    options.AddPolicy("Masters.Companies.Delete", policy =>
        policy.RequireAssertion(ctx => isRootSuper(ctx)));

    options.AddPolicy("Masters.Product", policy =>
        policy.RequireAssertion(ctx => hasMasterSubmodule(ctx, "masters:product")));

    options.AddPolicy("Masters.Employee", policy =>
        policy.RequireAssertion(ctx => hasMasterSubmodule(ctx, "masters:employee")));

    options.AddPolicy("Masters.Customer", policy =>
        policy.RequireAssertion(ctx => hasMasterSubmodule(ctx, "masters:customer")));

    options.AddPolicy("Masters.Supplier", policy =>
        policy.RequireAssertion(ctx => hasMasterSubmodule(ctx, "masters:supplier")));
});

// 6. Configure SignalR Hubs
builder.Services.AddSignalR();

// 7. Configure Health Checks
builder.Services.AddHealthChecks();

// 8. Configure Rate Limiting Policies
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("AuthPolicy", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 10;
        opt.QueueLimit = 0;
    });

    options.AddTokenBucketLimiter("ApiPolicy", opt =>
    {
        opt.TokenLimit = 100;
        opt.QueueLimit = 10;
        opt.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
        opt.TokensPerPeriod = 100;
        opt.AutoReplenishment = true;
    });

    options.AddFixedWindowLimiter("AdminPolicy", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 30;
        opt.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("FacePolicy", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 20;
        opt.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("RiskPolicy", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 30;
        opt.QueueLimit = 0;
    });
});

// 9. Configure Swagger / OpenAPI Documentation with JWT Bearer Security & Examples
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "INK FMCG Enterprise ERP API",
        Version = "v1",
        Description = "Enterprise FMCG Distribution ERP Platform API - ASP.NET Core 9 Clean Architecture IAM & Enterprise Security Engine"
    });

    options.OperationFilter<SecuritySwaggerExamplesFilter>();

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 10. Configure Production CORS Policy
var corsOrigins = builder.Configuration.GetSection("AllowedCorsOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendClient", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ====================================================
// MIDDLEWARE PIPELINE ORDER
// Exception -> Correlation -> Security Headers -> Idempotency -> CORS -> Authentication -> Authorization -> Rate Limiting -> Response Caching -> Endpoints
// ====================================================

// 1. Exception Handling Middleware
app.UseExceptionHandler();
app.UseStatusCodePages();

// 2. Correlation ID Middleware
app.UseMiddleware<CorrelationIdMiddleware>();

// 3. Security Headers Middleware
app.UseMiddleware<SecurityHeadersMiddleware>();

// 4. Idempotency Key Middleware
app.UseMiddleware<IdempotencyMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "INK FMCG ERP API v1");
    });
}

app.UseSerilogRequestLogging();

// 5. CORS
app.UseCors("AllowFrontendClient");

// 6. Authentication
app.UseAuthentication();

// 7. Authorization
app.UseAuthorization();

// 8. Rate Limiting
app.UseRateLimiter();

// 9. Response Caching
app.UseResponseCaching();

// Hangfire Dashboard Middleware
try
{
    app.UseHangfireDashboard("/hangfire", new DashboardOptions());
}
catch (Exception ex)
{
    Log.Warning(ex, "Hangfire Dashboard initialization bypassed (database connection unavailable at startup)");
}

// 10. Health Check Endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = reg => reg.Name == "PostgreSQL" || reg.Name == "Redis" || reg.Name == "Hangfire" || reg.Name == "FaceModel"
});

// 11. Map Endpoints
app.MapControllers();

// 10.5. Seed & Migrate Database
lock (Program.StartupDbLock)
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<INK.ERP.Persistence.AppDbContext>();
            var userManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<INK.ERP.Domain.Common.ApplicationUser>>();
            var roleManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<INK.ERP.Domain.Common.ApplicationRole>>();
            var logger = services.GetRequiredService<Microsoft.Extensions.Logging.ILogger<Program>>();
            
            if (app.Environment.IsEnvironment("Testing"))
            {
                var config = services.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
                string? connStr = config.GetConnectionString("Database") ?? config["Database:ConnectionString"];
                if (string.IsNullOrWhiteSpace(connStr) || !connStr.Contains("ink_fmcg_erp_test", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException("[CRITICAL DATABASE SAFETY GUARD TRIGGERED] Automated tests must connect exclusively to 'ink_fmcg_erp_test'.");
                }
                context.Database.Migrate();
            }

            // Seed IAM data
            INK.ERP.Infrastructure.Persistence.Seeding.IamDbSeeder.SeedAsync(context, userManager, roleManager, logger).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<Microsoft.Extensions.Logging.ILogger<Program>>();
            logger.LogError(ex, "An error occurred during database migration or seeding.");
            if (app.Environment.IsEnvironment("Testing"))
            {
                throw;
            }
        }
    }
}

app.Run();

public partial class Program
{
    public static readonly object StartupDbLock = new();
}

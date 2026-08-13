using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace INK.ERP.API.OpenApi;

public sealed class SecuritySwaggerExamplesFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var path = context.ApiDescription.RelativePath?.ToLowerInvariant() ?? string.Empty;

        if (path.Contains("security/risk/calculate"))
        {
            operation.Summary = "Evaluates security risk score (0-100) and risk level";
            operation.RequestBody = new OpenApiRequestBody
            {
                Description = "Authentication Context Payload",
                Content =
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new OpenApiObject
                        {
                            ["userId"] = new OpenApiString(Guid.NewGuid().ToString()),
                            ["ipAddress"] = new OpenApiString("192.168.1.100"),
                            ["deviceId"] = new OpenApiString(Guid.NewGuid().ToString())
                        }
                    }
                }
            };
        }
        else if (path.Contains("security/policy/global"))
        {
            operation.Summary = "Updates global security policy (supports If-Match ETag)";
            operation.RequestBody = new OpenApiRequestBody
            {
                Description = "Global Security Policy Update Model",
                Content =
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new OpenApiObject
                        {
                            ["policyId"] = new OpenApiString(Guid.NewGuid().ToString()),
                            ["minFaceConfidenceScore"] = new OpenApiFloat(0.85f),
                            ["maxAllowedGpsRadiusMeters"] = new OpenApiDouble(150.0),
                            ["passwordMinLength"] = new OpenApiInteger(12)
                        }
                    }
                }
            };
        }
        else if (path.Contains("security/incident/raise"))
        {
            operation.Summary = "Manually reports a security incident (supports Idempotency-Key)";
            operation.RequestBody = new OpenApiRequestBody
            {
                Description = "Security Incident Report Payload",
                Content =
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new OpenApiObject
                        {
                            ["type"] = new OpenApiString("SpoofingAttempt"),
                            ["severity"] = new OpenApiString("High"),
                            ["description"] = new OpenApiString("Multiple failed face verification attempts from unauthorized device.")
                        }
                    }
                }
            };
        }
    }
}

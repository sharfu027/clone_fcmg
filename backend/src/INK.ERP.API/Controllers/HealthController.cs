namespace INK.ERP.API.Controllers;

using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/[controller]")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult CheckHealth()
    {
        return Ok(new
        {
            Status = "Healthy",
            System = "INK FMCG Distribution ERP API Foundation",
            Version = "1.0.0",
            Timestamp = DateTime.UtcNow
        });
    }
}

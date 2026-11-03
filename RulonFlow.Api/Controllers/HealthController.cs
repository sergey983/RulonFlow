using Microsoft.AspNetCore.Mvc;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "ok",
            api = "RulonFlow.Api",
            version = "v1"
        });
    }
}
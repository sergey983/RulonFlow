using Microsoft.AspNetCore.Mvc;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/dev-tools")]
public class DevToolsController : ControllerBase
{
    [HttpGet("hash-password")]
    public IActionResult HashPassword([FromQuery] string password)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        return Ok(new
        {
            password,
            hash
        });
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/database-health")]
public class DatabaseHealthController : ControllerBase
{
    private readonly RulonFlowDbContext _dbContext;

    public DatabaseHealthController(RulonFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            var canConnect = await _dbContext.Database.CanConnectAsync();

            return Ok(new
            {
                status = canConnect ? "ok" : "unavailable",
                database = "MySQL",
                connected = canConnect
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "error",
                message = ex.Message
            });
        }
    }
}
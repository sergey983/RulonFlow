using Microsoft.AspNetCore.Mvc;
using RulonFlow.Api.DTOs.Auth;
using RulonFlow.Api.Services;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new
            {
                error = new
                {
                    code = "UNAUTHORIZED",
                    message = "Неверный логин или пароль"
                }
            });
        }
    }
}
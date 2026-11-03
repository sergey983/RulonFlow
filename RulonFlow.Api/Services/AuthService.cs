using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RulonFlow.Api.DTOs.Auth;
using RulonFlow.Infrastructure.Persistence;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RulonFlow.Api.Services;

public class AuthService
{
    private readonly RulonFlowDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthService(RulonFlowDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Login == request.Login);

        if (user is null || !user.IsActive || user.PasswordHash is null)
        {
            throw new UnauthorizedAccessException("Неверный логин или пароль");
        }

        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!passwordOk)
        {
            throw new UnauthorizedAccessException("Неверный логин или пароль");
        }

        var secret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Не задан Jwt:Secret");

        var issuer = _configuration["Jwt:Issuer"] ?? "RulonFlow";
        var audience = _configuration["Jwt:Audience"] ?? "RulonFlow";

        var lifetimeHours = int.Parse(
            _configuration["Jwt:AccessTokenLifetimeHours"] ?? "8");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Uuid.ToString()),
            new Claim(ClaimTypes.Name, user.Login),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(lifetimeHours),
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = Guid.NewGuid().ToString();

        return new LoginResponseDto(
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddHours(lifetimeHours),
            new UserDto(user.Uuid, user.Login, user.FullName, user.Role));
    }
}
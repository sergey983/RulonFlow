﻿﻿﻿﻿using Microsoft.EntityFrameworkCore;
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
            .Include(x => x.Roles)
                .ThenInclude(x => x.Role)
                    .ThenInclude(x => x.Permissions)
                        .ThenInclude(x => x.Permission)
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
            new Claim(ClaimTypes.Name, user.Login)
        };

        foreach (var userRole in user.Roles)
        {
            if (userRole.Role.IsActive)
            {
                claims = claims.Append(new Claim(ClaimTypes.Role, userRole.Role.Name)).ToArray();

                // Добавляем разрешения (permissions) из роли
                foreach (var rp in userRole.Role.Permissions)
                {
                    claims = claims.Append(new Claim("permission", rp.Permission.Code)).ToArray();
                }
            }
        }

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

        var userRoles = user.Roles
            .Where(x => x.Role.IsActive)
            .Select(x => x.Role.Name);

        var userPermissions = user.Roles
            .Where(x => x.Role.IsActive)
            .SelectMany(x => x.Role.Permissions)
            .Select(x => x.Permission.Code);

        return new LoginResponseDto(
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddHours(lifetimeHours),
            new UserDto(user.Uuid, user.Login, user.FullName, userRoles, userPermissions));
    }
}
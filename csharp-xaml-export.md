csharp-xaml-export.md
CSharpXamlProject.ps1
RulonFlow.Api
    appsettings.Development.json
    appsettings.json
    Controllers
        AuthController.cs
```cs
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
```
        CounterpartiesController.cs
```cs
// RulonFlow.Api/Controllers/CounterpartiesController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/counterparties")]
public class CounterpartiesController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public CounterpartiesController(RulonFlowDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _db.Counterparties.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(x => x.Name.Contains(search));

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive);

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, page, pageSize, totalCount = total });
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> Get(Guid uuid)
    {
        var item = await _db.Counterparties.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Counterparty item)
    {
        item.Uuid = Guid.NewGuid();
        item.CreatedAt = DateTime.UtcNow;

        _db.Counterparties.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { uuid = item.Uuid }, item);
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, [FromBody] Counterparty patch)
    {
        var item = await _db.Counterparties.FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
            return NotFound();

        item.Name = patch.Name;
        item.Inn = patch.Inn;
        item.Kpp = patch.Kpp;
        item.LegalAddressText = patch.LegalAddressText;
        item.IsActive = patch.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(item);
    }
}
```
        DatabaseHealthController.cs
```cs
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
```
        DefectReasonsController.cs
```cs
// RulonFlow.Api/Controllers/DefectReasonsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/defect-reasons")]
public class DefectReasonsController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public DefectReasonsController(RulonFlowDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _db.DefectReasons.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(x => x.Name.Contains(search));

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive);

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, page, pageSize, totalCount = total });
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> Get(Guid uuid)
    {
        var item = await _db.DefectReasons.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DefectReason item)
    {
        item.Uuid = Guid.NewGuid();
        item.CreatedAt = DateTime.UtcNow;

        _db.DefectReasons.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { uuid = item.Uuid }, item);
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, [FromBody] DefectReason patch)
    {
        var item = await _db.DefectReasons.FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
            return NotFound();

        item.Name = patch.Name;
        item.Description = patch.Description;
        item.IsActive = patch.IsActive;
        item.SortOrder = patch.SortOrder;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(item);
    }
}
```
        DevToolsController.cs
```cs
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
```
        FilmTypesController.cs
```cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/film-types")]
public class FilmTypesController : ControllerBase
{
    private readonly RulonFlowDbContext _dbContext;

    public FilmTypesController(RulonFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetFilmTypes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _dbContext.FilmTypes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.Name.Contains(search) ||
                x.BaseMaterial.Contains(search));
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.BaseMaterial)
            .ThenBy(x => x.ThicknessMicron)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount
        });
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> GetFilmType(Guid uuid)
    {
        var item = await _dbContext.FilmTypes
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> CreateFilmType([FromBody] FilmType request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите наименование марки плёнки."
                }
            });
        }

        if (string.IsNullOrWhiteSpace(request.BaseMaterial))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите базовый материал."
                }
            });
        }

        if (request.ThicknessMicron <= 0)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Толщина должна быть больше нуля."
                }
            });
        }

        var nameExists = await _dbContext.FilmTypes
            .AnyAsync(x => x.Name == request.Name);

        if (nameExists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "BUSINESS_RULE_VIOLATION",
                    message = "Марка с таким наименованием уже существует."
                }
            });
        }

        var combinationExists = await _dbContext.FilmTypes
            .AnyAsync(x =>
                x.BaseMaterial == request.BaseMaterial &&
                x.ThicknessMicron == request.ThicknessMicron);

        if (combinationExists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "BUSINESS_RULE_VIOLATION",
                    message = "Для этого материала и толщины марка уже существует."
                }
            });
        }

        var item = new FilmType
        {
            Uuid = Guid.NewGuid(),
            Name = request.Name.Trim(),
            BaseMaterial = request.BaseMaterial.Trim(),
            ThicknessMicron = request.ThicknessMicron,
            DensityGcm3 = request.DensityGcm3,
            PricePerKg = request.PricePerKg,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.FilmTypes.Add(item);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetFilmType),
            new { uuid = item.Uuid },
            item);
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> UpdateFilmType(
        Guid uuid,
        [FromBody] FilmType request)
    {
        var item = await _dbContext.FilmTypes
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите наименование марки плёнки."
                }
            });
        }

        var nameExists = await _dbContext.FilmTypes
            .AnyAsync(x =>
                x.Uuid != uuid &&
                x.Name == request.Name);

        if (nameExists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "BUSINESS_RULE_VIOLATION",
                    message = "Марка с таким наименованием уже существует."
                }
            });
        }

        var combinationExists = await _dbContext.FilmTypes
            .AnyAsync(x =>
                x.Uuid != uuid &&
                x.BaseMaterial == request.BaseMaterial &&
                x.ThicknessMicron == request.ThicknessMicron);

        if (combinationExists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "BUSINESS_RULE_VIOLATION",
                    message = "Для этого материала и толщины марка уже существует."
                }
            });
        }

        item.Name = request.Name.Trim();
        item.BaseMaterial = request.BaseMaterial.Trim();
        item.ThicknessMicron = request.ThicknessMicron;
        item.DensityGcm3 = request.DensityGcm3;
        item.PricePerKg = request.PricePerKg;
        item.Description = request.Description;
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(item);
    }
}
```
        HealthController.cs
```cs
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
```
        SuppliersController.cs
```cs
// RulonFlow.Api/Controllers/SuppliersController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public SuppliersController(RulonFlowDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _db.Suppliers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(x => x.Name.Contains(search));

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive);

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, page, pageSize, totalCount = total });
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> Get(Guid uuid)
    {
        var item = await _db.Suppliers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Supplier item)
    {
        item.Uuid = Guid.NewGuid();

        _db.Suppliers.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { uuid = item.Uuid }, item);
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, [FromBody] Supplier patch)
    {
        var item = await _db.Suppliers.FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
            return NotFound();

        item.Name = patch.Name;
        item.Inn = patch.Inn;
        item.IsActive = patch.IsActive;

        await _db.SaveChangesAsync();
        return Ok(item);
    }
}
```
        WeatherForecastController.cs
```cs
using Microsoft.AspNetCore.Mvc;

namespace RulonFlow.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private static readonly string[] Summaries =
        [
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        ];

        [HttpGet(Name = "GetWeatherForecast")]
        public IEnumerable<WeatherForecast> Get()
        {
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();
        }
    }
}
```
    DTOs
        Auth
            LoginRequestDto.cs
```cs
namespace RulonFlow.Api.DTOs.Auth;

public record LoginRequestDto(
    string Login,
    string Password,
    string? DeviceHardwareId);
```
            LoginResponseDto.cs
```cs
namespace RulonFlow.Api.DTOs.Auth;

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

public record UserDto(
    Guid Uuid,
    string Login,
    string FullName,
    string Role);
```
    Extensions
        DependencyInjectionExtensions.cs
```cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RulonFlow.Api.Services;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddRulonFlowInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("RulonFlow");

        services.AddDbContext<RulonFlowDbContext>(options =>
            options.UseMySql(
                connectionString,
                ServerVersion.AutoDetect(connectionString)));

        return services;
    }

    public static IServiceCollection AddRulonFlowApplication(
        this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        return services;
    }
}
```
    Middleware
    Program.cs
```cs
using RulonFlow.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddRulonFlowInfrastructure(builder.Configuration);
builder.Services.AddRulonFlowApplication();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```
    Properties
        launchSettings.json
    RulonFlow.Api.csproj
```csproj
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="BCrypt.Net-Next" Version="4.2.0" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.14" />
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.14" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Swashbuckle.AspNetCore" Version="10.3.1" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\RulonFlow.Application\RulonFlow.Application.csproj" />
    <ProjectReference Include="..\RulonFlow.Infrastructure\RulonFlow.Infrastructure.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Folder Include="Middleware\" />
  </ItemGroup>

</Project>
```
    RulonFlow.Api.csproj.user
    RulonFlow.Api.http
    Services
        AuthService.cs
```cs
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
```
    WeatherForecast.cs
```cs
namespace RulonFlow.Api
{
    public class WeatherForecast
    {
        public DateOnly Date { get; set; }

        public int TemperatureC { get; set; }

        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);

        public string? Summary { get; set; }
    }
}
```
RulonFlow.Application
    DTOs
        Auth
    Interfaces
    RulonFlow.Application.csproj
```csproj
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\RulonFlow.Domain\RulonFlow.Domain.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Folder Include="DTOs\Auth\" />
    <Folder Include="Interfaces\" />
    <Folder Include="Validators\" />
  </ItemGroup>

</Project>
```
    Validators
RulonFlow.Domain
    Entities
        Counterparty.cs
```cs
// RulonFlow.Domain/Entities/Counterparty.cs
namespace RulonFlow.Domain.Entities;

public class Counterparty
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Inn { get; set; }
    public string? Kpp { get; set; }
    public string? LegalAddressText { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```
        DefectReason.cs
```cs
// RulonFlow.Domain/Entities/DefectReason.cs
namespace RulonFlow.Domain.Entities;

public class DefectReason
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public uint SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```
        FilmBrandAlias.cs
```cs
using System;
using System.Collections.Generic;
using System.Text;

namespace RulonFlow.Domain.Entities
{
    public class FilmBrandAlias
    {
        public Guid Uuid { get; set; }
        public Guid SupplierUuid { get; set; }
        public string SupplierFilmName { get; set; } = string.Empty;
        public Guid FilmTypeUuid { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public Supplier Supplier { get; set; } = null!;
        public FilmType FilmType { get; set; } = null!;
    }
}
```
        FilmType.cs
```cs
namespace RulonFlow.Domain.Entities;

public class FilmType
{
    public Guid Uuid { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal? DensityGcm3 { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<FilmTypeParam> Params { get; set; } = [];
}
```
        FilmTypeParam.cs
```cs
using System;
using System.Collections.Generic;
using System.Text;

namespace RulonFlow.Domain.Entities
{
    public class FilmTypeParam
    {
        public Guid Uuid { get; set; }
        public Guid FilmTypeUuid { get; set; }
        public int ThicknessMicron { get; set; }
        public decimal? Surface { get; set; }
        public decimal? Price { get; set; }
        public string CurrencyCode { get; set; } = "RUB";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public FilmType FilmType { get; set; } = null!;
    }
}
```
        Supplier.cs
```cs
// RulonFlow.Domain/Entities/Supplier.cs
// Supplier.cs
public class Supplier
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Inn { get; set; }
    public bool IsActive { get; set; } = true;
}
```
        User.cs
```cs
namespace RulonFlow.Domain.Entities;

public class User
{
    public Guid Uuid { get; set; }
    public string Login { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
```
    RulonFlow.Domain.csproj
```csproj
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

</Project>
```
RulonFlow.Infrastructure
    Auth
    Persistence
        Migrations
        RulonFlowDbContext.cs
```cs
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Infrastructure.Persistence;

public class RulonFlowDbContext : DbContext
{
    public RulonFlowDbContext(DbContextOptions<RulonFlowDbContext> options)
        : base(options)
    {
    }

    public DbSet<FilmType> FilmTypes => Set<FilmType>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Counterparty> Counterparties => Set<Counterparty>();
    public DbSet<DefectReason> DefectReasons => Set<DefectReason>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FilmType>(entity =>
        {
            entity.ToTable("film_types");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.BaseMaterial)
                .HasColumnName("base_material")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.ThicknessMicron)
                .HasColumnName("thickness_micron");

            entity.Property(x => x.DensityGcm3)
                .HasColumnName("density_g_cm3");

            entity.Property(x => x.PricePerKg)
                .HasColumnName("price_per_kg");

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Login).HasColumnName("login").HasMaxLength(100).IsRequired();
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Role).HasColumnName("role").HasMaxLength(50).IsRequired();
            entity.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(255);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.Property(x => x.LastLoginAt).HasColumnName("last_login_at");

            entity.HasIndex(x => x.Login).IsUnique();
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("suppliers");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Inn).HasColumnName("inn").HasMaxLength(20);
            entity.Property(x => x.IsActive).HasColumnName("is_active");

            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<Counterparty>(entity =>
        {
            entity.ToTable("counterparties");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Inn).HasColumnName("inn").HasMaxLength(20);
            entity.Property(x => x.Kpp).HasColumnName("kpp").HasMaxLength(20);
            entity.Property(x => x.LegalAddressText).HasColumnName("legal_address_text").HasMaxLength(500);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<DefectReason>(entity =>
        {
            entity.ToTable("defect_reasons");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.SortOrder).HasColumnName("sort_order");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(x => x.Name).IsUnique();
        });

        base.OnModelCreating(modelBuilder);
    }
}
```
    Repositories
    RulonFlow.Infrastructure.csproj
```csproj
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="MySqlConnector" Version="2.6.2" />
    <PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="9.0.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\RulonFlow.Application\RulonFlow.Application.csproj" />
    <ProjectReference Include="..\RulonFlow.Domain\RulonFlow.Domain.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Folder Include="Repositories\" />
    <Folder Include="Auth\" />
  </ItemGroup>

</Project>
```
RulonFlow.slnx
RulonFlow.Web
    .gitignore
    .idea
        .gitignore
        inspectionProfiles
            Project_Default.xml
```xml
<component name="InspectionProjectProfileManager">
  <profile version="1.0">
    <option name="myName" value="Project Default" />
    <inspection_tool class="Eslint" enabled="true" level="WARNING" enabled_by_default="true" />
  </profile>
</component>
```
        misc.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectRootManager" version="2">
    <output url="file://$PROJECT_DIR$/out" />
  </component>
</project>
```
        modules.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
      <module fileurl="file://$PROJECT_DIR$/.idea/RulonFlow.Web.iml" filepath="$PROJECT_DIR$/.idea/RulonFlow.Web.iml" />
    </modules>
  </component>
</project>
```
        RulonFlow.Web.iml
        workspace.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ChangeListManager">
    <list default="true" id="64f66241-c23b-492a-94ef-9180f7caabdb" name="Changes" comment="" />
    <option name="SHOW_DIALOG" value="false" />
    <option name="HIGHLIGHT_CONFLICTS" value="true" />
    <option name="HIGHLIGHT_NON_ACTIVE_CHANGELIST" value="false" />
    <option name="LAST_RESOLUTION" value="IGNORE" />
  </component>
  <component name="FileTemplateManagerImpl">
    <option name="RECENT_TEMPLATES">
      <list>
        <option value="CSS File" />
        <option value="TypeScript JSX File" />
        <option value="TypeScript File" />
      </list>
    </option>
  </component>
  <component name="ProjectColorInfo"><![CDATA[{
  "associatedIndex": 8
}]]></component>
  <component name="ProjectId" id="3LaMpeh0yHH20Fg8VG8Q5XqOWty" />
  <component name="ProjectViewState">
    <option name="hideEmptyMiddlePackages" value="true" />
    <option name="showLibraryContents" value="true" />
  </component>
  <component name="PropertiesComponent"><![CDATA[{
  "keyToString": {
    "ModuleVcsDetector.initialDetectionPerformed": "true",
    "RunOnceActivity.ShowReadmeOnStart": "true",
    "RunOnceActivity.TerminalTabsStorage.copyFrom.TerminalArrangementManager.252": "true",
    "RunOnceActivity.typescript.service.memoryLimit.init": "true",
    "ignore.virus.scanning.warn.message": "true",
    "kotlin-language-version-configured": "true",
    "last_opened_file_path": "C:/Users/SizovSV/source/repos/RulonFlow/RulonFlow.Web",
    "list.type.of.created.stylesheet": "CSS",
    "node.js.detected.package.eslint": "true",
    "node.js.selected.package.eslint": "(autodetect)",
    "nodejs_package_manager_path": "npm",
    "ts.external.directory.path": "C:\\Users\\SizovSV\\source\\repos\\RulonFlow\\RulonFlow.Web\\node_modules\\typescript\\lib",
    "vue.rearranger.settings.migration": "true"
  }
}]]></component>
  <component name="RecentsManager">
    <key name="MoveFile.RECENT_KEYS">
      <recent name="C:\Users\SizovSV\source\repos\RulonFlow\RulonFlow.Web\src\types" />
      <recent name="C:\Users\SizovSV\source\repos\RulonFlow\RulonFlow.Web\src\pages" />
    </key>
  </component>
  <component name="SharedIndexes">
    <attachedChunks>
      <set>
        <option value="bundled-jdk-30f59d01ecdd-2fc7cc6b9a17-intellij.indexing.shared.core-IU-253.31033.143" />
        <option value="bundled-js-predefined-d6986cc7102b-9b0f141eb926-JavaScript-IU-253.31033.143" />
      </set>
    </attachedChunks>
  </component>
  <component name="TaskManager">
    <task active="true" id="Default" summary="Default task">
      <changelist id="64f66241-c23b-492a-94ef-9180f7caabdb" name="Changes" comment="" />
      <created>1793687910273</created>
      <option name="number" value="Default" />
      <option name="presentableId" value="Default" />
      <updated>1793687910273</updated>
      <workItem from="1793687911384" duration="11796000" />
    </task>
    <servers />
  </component>
  <component name="TypeScriptGeneratedFilesManager">
    <option name="version" value="3" />
  </component>
</project>
```
    eslint.config.js
    index.html
    package.json
    package-lock.json
    public
        favicon.svg
        icons.svg
    README.md
    src
        api
            client.ts
            counterparties.ts
            defectReasons.ts
            filmTypes.ts
            suppliers.ts
        App.css
        App.tsx
        assets
            hero.png
            react.svg
            vite.svg
        index.css
        layout
            AppLayout.css
            AppLayout.tsx
        main.tsx
        pages
            ComingSoonPage.tsx
            CounterpartiesPage.tsx
            DefectReasonsPage.tsx
            dictionaries
                DictionaryLayout.tsx
            FilmTypesPage.tsx
            HomePage.tsx
            SuppliersPage.tsx
    tsconfig.app.json
    tsconfig.json
    tsconfig.node.json
    vite.config.ts

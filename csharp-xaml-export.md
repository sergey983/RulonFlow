.gigacode
    settings.json
    settings.json.orig
.gitattributes
.gitignore
csharp-xaml-export.md
CSharpXamlProject.ps1
Dump20261126.sql
nuget.config
```config
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
  </packageSources>
</configuration>
```
RulonFlow.Api
    App_Data
        receipt-imports
            1aad7750-85d8-4315-a58b-62d8d1d75716.xlsx
            1ac43e7c-069a-4e60-89cf-6bfbf360a055.xlsx
            1d939e21-7365-4bce-a837-1ca37a9a02e0.xlsx
            49136c60-d264-49c4-956b-2218198ad29b.xlsx
            4977442d-6441-4f79-b4d2-d3b7b44fe411.xlsx
            4caab0fb-114a-4b16-8558-d7ac84e64939.xlsx
            4f9bb098-79c6-4893-aca0-e610ca16c866.xlsx
            50a51641-c2f4-4f7a-aeee-852e009accab.xlsx
            52ec7eee-d096-4520-a9c7-7640c82d35ab.xlsx
            5dd623f6-937b-4e16-a1fe-f471d332c22b.xlsx
            6f3cab36-80eb-446d-a71a-23596754c7f7.xlsx
            8953b03f-19bf-41b9-9260-55d78d1762e2.xlsx
            8c6b3059-b799-473e-b67b-c3a615bc3773.xlsx
            930bc76b-fd4e-4443-ae9c-26d4c4f6fbab.xlsx
            bf0923ad-db69-44ad-82b5-897d792bd6e4.xlsx
            c0b6fa7b-6e45-4345-aa26-c33c296bab78.xlsx
            c0bc013e-e2f3-4a02-bdb1-391ceec28ba9.xlsx
            c281278b-6847-4f0d-8e35-42d58cdc6369.xlsx
            d47184c5-92ca-4f9c-8bb9-559d2dab9fe6.xlsx
            d9fda2f9-febd-48d5-bd97-4ef2af9efe78.xlsx
            e1833e37-8ecb-492e-b22f-7b5832873c70.xlsx
            f133fa45-7c36-4dcc-9f24-96cc65167190.xlsx
            f34df4ff-1e1f-4ded-8a71-87a7496d37f3.xlsx
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
        FilmBrandAliasesController.cs
```cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.FilmBrandAliases;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/film-brand-aliases")]
public class FilmBrandAliasesController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public FilmBrandAliasesController(RulonFlowDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] Guid? supplierUuid = null,
        [FromQuery] Guid? filmTypeUuid = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _db.FilmBrandAliases
            .AsNoTracking()
            .Include(x => x.Supplier)
            .Include(x => x.FilmType)
            .AsQueryable();

        if (supplierUuid.HasValue)
            query = query.Where(x => x.SupplierUuid == supplierUuid);

        if (filmTypeUuid.HasValue)
            query = query.Where(x => x.FilmTypeUuid == filmTypeUuid);

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(x =>
                x.SupplierFilmName.Contains(search) ||
                x.Supplier.Name.Contains(search) ||
                x.FilmType.Brand.Contains(search));

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.Supplier.Name)
            .ThenBy(x => x.SupplierFilmName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new FilmBrandAliasDto(
                x.Uuid,
                x.SupplierUuid,
                x.Supplier.Name,
                x.SupplierFilmName,
                x.FilmTypeUuid,
                x.FilmType.Brand,
                x.IsActive
            ))
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount = total
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] FilmBrandAliasFormValues request)
    {
        if (request.SupplierUuid == Guid.Empty)
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Выберите поставщика."
                }
            });

        if (string.IsNullOrWhiteSpace(request.SupplierFilmName))
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите название плёнки у поставщика."
                }
            });

        if (request.FilmTypeUuid == Guid.Empty)
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Выберите марку плёнки."
                }
            });

        var supplierExists = await _db.Suppliers
            .AnyAsync(x => x.Uuid == request.SupplierUuid);

        if (!supplierExists)
            return NotFound(new
            {
                error = new
                {
                    code = "SUPPLIER_NOT_FOUND",
                    message = "Поставщик не найден."
                }
            });

        var filmTypeExists = await _db.FilmTypes
            .AnyAsync(x => x.Uuid == request.FilmTypeUuid);

        if (!filmTypeExists)
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_NOT_FOUND",
                    message = "Марка плёнки не найдена."
                }
            });

        var supplierFilmName = request.SupplierFilmName.Trim();

        var exists = await _db.FilmBrandAliases
            .AnyAsync(x =>
                x.SupplierUuid == request.SupplierUuid &&
                x.SupplierFilmName == supplierFilmName);

        if (exists)
            return Conflict(new
            {
                error = new
                {
                    code = "FILM_BRAND_ALIAS_ALREADY_EXISTS",
                    message = "Такое соответствие для этого поставщика уже существует."
                }
            });

        var item = new FilmBrandAlias
        {
            Uuid = Guid.NewGuid(),
            SupplierUuid = request.SupplierUuid,
            SupplierFilmName = supplierFilmName,
            FilmTypeUuid = request.FilmTypeUuid,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.FilmBrandAliases.Add(item);
        await _db.SaveChangesAsync();

        var dto = await _db.FilmBrandAliases
            .AsNoTracking()
            .Where(x => x.Uuid == item.Uuid)
            .Select(x => new FilmBrandAliasDto(
                x.Uuid,
                x.SupplierUuid,
                x.Supplier.Name,
                x.SupplierFilmName,
                x.FilmTypeUuid,
                x.FilmType.Brand,
                x.IsActive
            ))
            .FirstAsync();

        return CreatedAtAction(nameof(GetList), new { }, dto);
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> Update(
        Guid uuid,
        [FromBody] FilmBrandAliasFormValues request)
    {
        var item = await _db.FilmBrandAliases
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_BRAND_ALIAS_NOT_FOUND",
                    message = "Соответствие не найдено."
                }
            });

        if (request.SupplierUuid == Guid.Empty ||
            request.FilmTypeUuid == Guid.Empty ||
            string.IsNullOrWhiteSpace(request.SupplierFilmName))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Заполните поставщика, название у поставщика и марку."
                }
            });
        }

        var supplierFilmName = request.SupplierFilmName.Trim();

        var exists = await _db.FilmBrandAliases
            .AnyAsync(x =>
                x.Uuid != uuid &&
                x.SupplierUuid == request.SupplierUuid &&
                x.SupplierFilmName == supplierFilmName);

        if (exists)
            return Conflict(new
            {
                error = new
                {
                    code = "FILM_BRAND_ALIAS_ALREADY_EXISTS",
                    message = "Такое соответствие для этого поставщика уже существует."
                }
            });

        item.SupplierUuid = request.SupplierUuid;
        item.SupplierFilmName = supplierFilmName;
        item.FilmTypeUuid = request.FilmTypeUuid;
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var dto = await _db.FilmBrandAliases
            .AsNoTracking()
            .Where(x => x.Uuid == uuid)
            .Select(x => new FilmBrandAliasDto(
                x.Uuid,
                x.SupplierUuid,
                x.Supplier.Name,
                x.SupplierFilmName,
                x.FilmTypeUuid,
                x.FilmType.Brand,
                x.IsActive
            ))
            .FirstAsync();

        return Ok(dto);
    }

    [HttpDelete("{uuid:guid}")]
    public async Task<IActionResult> Delete(Guid uuid)
    {
        var item = await _db.FilmBrandAliases
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_BRAND_ALIAS_NOT_FOUND",
                    message = "Соответствие не найдено."
                }
            });

        _db.FilmBrandAliases.Remove(item);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
```
        FilmTypesController.cs
```cs
??using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.FilmTypes;
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
        var query = _dbContext.FilmTypes
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Brand.Contains(search));
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.Brand)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new FilmTypeDto(
                x.Uuid,
                x.Brand,
                x.DensityGcm3,
                x.Description,
                x.IsActive
            ))
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
            .Where(x => x.Uuid == uuid)
            .Select(x => new FilmTypeDto(
                x.Uuid,
                x.Brand,
                x.DensityGcm3,
                x.Description,
                x.IsActive
            ))
            .FirstOrDefaultAsync();

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_NOT_FOUND",
                    message = "Марка плёнки не найдена."
                }
            });
        }

        return Ok(item);
    }

    [HttpGet("{uuid:guid}/params")]
    public async Task<IActionResult> GetFilmTypeParams(Guid uuid)
    {
        var filmTypeExists = await _dbContext.FilmTypes
            .AsNoTracking()
            .AnyAsync(x => x.Uuid == uuid);

        if (!filmTypeExists)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_NOT_FOUND",
                    message = "Марка плёнки не найдена."
                }
            });
        }

        var items = await _dbContext.FilmTypeParams
            .AsNoTracking()
            .Where(x => x.FilmTypeUuid == uuid)
            .OrderBy(x => x.ThicknessMicron)
            .Select(x => new FilmTypeParamDto(
                x.Uuid,
                x.FilmTypeUuid,
                x.FilmType.Brand,
                x.ThicknessMicron,
                x.Surface,
                x.Price,
                x.CurrencyCode,
                x.IsActive
            ))
            .ToListAsync();

        return Ok(new { items });
    }

    [HttpGet("params")]
    public async Task<IActionResult> GetAllFilmTypeParams(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _dbContext.FilmTypeParams
            .AsNoTracking()
            .Include(x => x.FilmType)
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.FilmType.Brand)
            .ThenBy(x => x.ThicknessMicron)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new FilmTypeParamDto(
                x.Uuid,
                x.FilmTypeUuid,
                x.FilmType.Brand,
                x.ThicknessMicron,
                x.Surface,
                x.Price,
                x.CurrencyCode,
                x.IsActive
            ))
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount
        });
    }

    [HttpPatch("params/{paramUuid:guid}")]
    public async Task<IActionResult> UpdateFilmTypeParam(
        Guid paramUuid,
        [FromBody] FilmTypeParamFormValues request)
    {
        var item = await _dbContext.FilmTypeParams
            .FirstOrDefaultAsync(x => x.Uuid == paramUuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_PARAM_NOT_FOUND",
                    message = "Параметр марки плёнки не найден."
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
                    message = "Толщина должна быть больше 0."
                }
            });
        }

        var exists = await _dbContext.FilmTypeParams
            .AnyAsync(x =>
                x.Uuid != paramUuid &&
                x.FilmTypeUuid == item.FilmTypeUuid &&
                x.ThicknessMicron == request.ThicknessMicron);

        if (exists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "FILM_TYPE_PARAM_ALREADY_EXISTS",
                    message = "Для этой марки уже задана указанная толщина."
                }
            });
        }

        item.ThicknessMicron = request.ThicknessMicron;
        item.Surface = request.Surface;
        item.Price = request.Price;
        item.CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode)
            ? "RUB"
            : request.CurrencyCode.Trim().ToUpperInvariant();
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(new FilmTypeParamDto(
            item.Uuid,
            item.FilmTypeUuid,
            item.FilmType.Brand,
            item.ThicknessMicron,
            item.Surface,
            item.Price,
            item.CurrencyCode,
            item.IsActive
        ));
    }

    [HttpDelete("params/{paramUuid:guid}")]
    public async Task<IActionResult> DeleteFilmTypeParam(Guid paramUuid)
    {
        var item = await _dbContext.FilmTypeParams
            .FirstOrDefaultAsync(x => x.Uuid == paramUuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_PARAM_NOT_FOUND",
                    message = "Параметр марки плёнки не найден."
                }
            });
        }

        _dbContext.FilmTypeParams.Remove(item);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{uuid:guid}/params")]
    public async Task<IActionResult> CreateFilmTypeParam(
        Guid uuid,
        [FromBody] FilmTypeParamFormValues request)
    {
        var filmType = await _dbContext.FilmTypes
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (filmType is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_NOT_FOUND",
                    message = "Марка плёнки не найдена."
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
                    message = "Толщина должна быть больше 0."
                }
            });
        }

        var exists = await _dbContext.FilmTypeParams
            .AnyAsync(x =>
                x.FilmTypeUuid == uuid &&
                x.ThicknessMicron == request.ThicknessMicron);

        if (exists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "FILM_TYPE_PARAM_ALREADY_EXISTS",
                    message = "Для этой марки уже задана указанная толщина."
                }
            });
        }

        var item = new FilmTypeParam
        {
            Uuid = Guid.NewGuid(),
            FilmTypeUuid = uuid,
            ThicknessMicron = request.ThicknessMicron,
            Surface = request.Surface,
            Price = request.Price,
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode)
                ? "RUB"
                : request.CurrencyCode.Trim().ToUpperInvariant(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.FilmTypeParams.Add(item);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetFilmTypeParams),
            new { uuid },
            new FilmTypeParamDto(
                item.Uuid,
                item.FilmTypeUuid,
                item.FilmType.Brand,
                item.ThicknessMicron,
                item.Surface,
                item.Price,
                item.CurrencyCode,
                item.IsActive
            )
        );
    }

    [HttpPatch("{uuid:guid}/params/{paramUuid:guid}")]
    public async Task<IActionResult> UpdateFilmTypeParam(
        Guid uuid,
        Guid paramUuid,
        [FromBody] FilmTypeParamFormValues request)
    {
        var item = await _dbContext.FilmTypeParams
            .FirstOrDefaultAsync(x =>
                x.Uuid == paramUuid &&
                x.FilmTypeUuid == uuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_PARAM_NOT_FOUND",
                    message = "Параметр марки плёнки не найден."
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
                    message = "Толщина должна быть больше 0."
                }
            });
        }

        var exists = await _dbContext.FilmTypeParams
            .AnyAsync(x =>
                x.Uuid != paramUuid &&
                x.FilmTypeUuid == uuid &&
                x.ThicknessMicron == request.ThicknessMicron);

        if (exists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "FILM_TYPE_PARAM_ALREADY_EXISTS",
                    message = "Для этой марки уже задана указанная толщина."
                }
            });
        }

        item.ThicknessMicron = request.ThicknessMicron;
        item.Surface = request.Surface;
        item.Price = request.Price;
        item.CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode)
            ? "RUB"
            : request.CurrencyCode.Trim().ToUpperInvariant();
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(new FilmTypeParamDto(
            item.Uuid,
            item.FilmTypeUuid,
            item.FilmType.Brand,
            item.ThicknessMicron,
            item.Surface,
            item.Price,
            item.CurrencyCode,
            item.IsActive
        ));
    }

    [HttpDelete("{uuid:guid}/params/{paramUuid:guid}")]
    public async Task<IActionResult> DeleteFilmTypeParam(
        Guid uuid,
        Guid paramUuid)
    {
        var item = await _dbContext.FilmTypeParams
            .FirstOrDefaultAsync(x =>
                x.Uuid == paramUuid &&
                x.FilmTypeUuid == uuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_PARAM_NOT_FOUND",
                    message = "Параметр марки плёнки не найден."
                }
            });
        }

        _dbContext.FilmTypeParams.Remove(item);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost]
    public async Task<IActionResult> CreateFilmType(
        [FromBody] FilmTypeFormValues request)
    {
        if (string.IsNullOrWhiteSpace(request.Brand))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите марку."
                }
            });
        }

        var brand = request.Brand.Trim();

        var exists = await _dbContext.FilmTypes
            .AnyAsync(x => x.Brand == brand);

        if (exists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "FILM_TYPE_ALREADY_EXISTS",
                    message = "Марка с таким названием уже существует."
                }
            });
        }

        var item = new FilmType
        {
            Uuid = Guid.NewGuid(),
            Brand = brand,
            DensityGcm3 = request.DensityGcm3,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.FilmTypes.Add(item);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetFilmType),
            new { uuid = item.Uuid },
            new FilmTypeDto(
                item.Uuid,
                item.Brand,
                item.DensityGcm3,
                item.Description,
                item.IsActive
            )
        );
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> UpdateFilmType(
        Guid uuid,
        [FromBody] FilmTypeFormValues request)
    {
        var item = await _dbContext.FilmTypes
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "FILM_TYPE_NOT_FOUND",
                    message = "Марка плёнки не найдена."
                }
            });
        }

        if (string.IsNullOrWhiteSpace(request.Brand))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите марку."
                }
            });
        }

        var brand = request.Brand.Trim();

        var exists = await _dbContext.FilmTypes
            .AnyAsync(x =>
                x.Uuid != uuid &&
                x.Brand == brand);

        if (exists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "FILM_TYPE_ALREADY_EXISTS",
                    message = "Марка с таким названием уже существует."
                }
            });
        }

        item.Brand = brand;
        item.DensityGcm3 = request.DensityGcm3;
        item.Description = request.Description;
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(new FilmTypeDto(
            item.Uuid,
            item.Brand,
            item.DensityGcm3,
            item.Description,
            item.IsActive
        ));
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
        ImportReceiptsController.cs
```cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.ImportReceipts;
using RulonFlow.Api.Services;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;
using System.Security.Claims;

namespace RulonFlow.Api.Controllers;

public record ImportFileDto(
    Guid Uuid,
    Guid? SupplierUuid,
    string FileName,
    long FileSizeBytes,
    string? DetectedFormat,
    string Status,
    DateTime CreatedAt
);

[ApiController]
[Route("api/v1/import/receipts")]
public class ImportReceiptsController : ControllerBase
{
    private readonly RulonFlowDbContext _db;
    private readonly IWebHostEnvironment _environment;
    private readonly ReceiptImportParserService _parser;

    public ImportReceiptsController(
        RulonFlowDbContext db,
        IWebHostEnvironment environment,
        ReceiptImportParserService parser)
    {
        _db = db;
        _environment = environment;
        _parser = parser;
    }

    [HttpPost("file")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file,
        [FromForm] Guid? supplierUuid)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Выберите файл."
                }
            });
        }

        var allowedExtensions = new[] { ".xlsx", ".xls", ".csv" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Поддерживаются файлы XLSX, XLS и CSV."
                }
            });
        }

        var importsFolder = Path.Combine(
            _environment.ContentRootPath,
            "App_Data",
            "receipt-imports");

        Directory.CreateDirectory(importsFolder);

        var storedFileName = $"{Guid.NewGuid()}{extension}";
        var storedFilePath = Path.Combine(importsFolder, storedFileName);

        await using (var stream = System.IO.File.Create(storedFilePath))
        {
            await file.CopyToAsync(stream);
        }

        var item = new ImportFile
        {
            Uuid = Guid.NewGuid(),
            SupplierUuid = supplierUuid,
            FileName = file.FileName,
            StoredFilePath = storedFilePath,
            FileSizeBytes = file.Length,
            ContentType = file.ContentType,
            DetectedFormat = null,
            Status = "uploaded",
            UploadedByUuid = null,
            CreatedAt = DateTime.UtcNow
        };

        _db.ImportFiles.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new ImportFileDto(
            item.Uuid,
            item.SupplierUuid,
            item.FileName,
            item.FileSizeBytes,
            item.DetectedFormat,
            item.Status,
            item.CreatedAt
        ));
    }

    [HttpPost("{uuid:guid}/parse")]
    public async Task<IActionResult> Parse(Guid uuid)
    {
        try
        {
            var format = await _parser.ParseAsync(uuid);

            return Ok(new
            {
                uuid,
                detectedFormat = format,
                status = "parsed"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "IMPORT_PARSE_ERROR",
                    message = ex.Message
                }
            });
        }
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> Get(Guid uuid)
    {
        var item = await _db.ImportFiles
            .AsNoTracking()
            .Include(x => x.Rows)
                .ThenInclude(x => x.FilmType)
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "IMPORT_NOT_FOUND",
                    message = "Импорт не найден."
                }
            });
        }

        var rows = item.Rows
            .OrderBy(x => x.RowNumber)
            .ToList();

        var palletGroups = rows
            .Where(x => !string.IsNullOrWhiteSpace(x.PalletNumber))
            .GroupBy(
                x => x.PalletNumber!.Trim(),
                StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x.Key)
            .ToList();

        var palletNumbers = palletGroups
            .Select(x => x.Key)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingPalletNumbers = await _db.Pallets
            .AsNoTracking()
            .Where(x => palletNumbers.Contains(x.PalletNumber))
            .Select(x => x.PalletNumber)
            .ToListAsync();

        var existingPalletNumberSet = existingPalletNumbers
            .Select(x => x.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var pallets = palletGroups
            .Select(group =>
            {
                var groupRows = group.ToList();

                var netWeight = groupRows.Sum(
                    x => x.NetWeightKg ?? 0m);

                var grossWeight = netWeight * GettelPalletGrossCoefficient;

                var palletErrors = new List<string>();

                if (existingPalletNumberSet.Contains(group.Key))
                {
                    palletErrors.Add(
                        "Паллета с таким номером уже существует");
                }

                return new ImportPalletDto(
                    group.Key,
                    groupRows
                        .Select(x => x.PalletTypeUuid)
                        .FirstOrDefault(x => x.HasValue),
                    groupRows.Sum(x => x.RollCount ?? 0),
                    Math.Round(netWeight, 2),
                    Math.Round(grossWeight, 2),
                    palletErrors,
                    groupRows
                        .Select(ToDto)
                        .ToList()
                );
            })
            .ToList();

        return Ok(new ImportReceiptGroupedDto(
            item.Uuid,
            item.SupplierUuid,
            item.FileName,
            item.FileSizeBytes,
            item.DetectedFormat,
            item.Status,
            item.CreatedAt,
            pallets
        ));
    }
    [HttpPost("{uuid:guid}/confirm")]
    public async Task<IActionResult> Confirm(
    Guid uuid,
    [FromBody] ConfirmImportReceiptRequest request)
    {
        var createdByUuid = GetCurrentUserUuid();

        if (createdByUuid is null)
        {
            return Unauthorized(new
            {
                error = new
                {
                    code = "UNAUTHORIZED",
                    message = "Пользователь не авторизован."
                }
            });
        }

        try
        {
            await _parser.ConfirmAsync(
                uuid,
                createdByUuid.Value,
                request);

            return Ok(new
            {
                uuid,
                status = "confirmed"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "IMPORT_CONFIRM_ERROR",
                    message = ex.Message
                }
            });
        }
    }

    private Guid? GetCurrentUserUuid()
    {
        var value =
            User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("nameid")?.Value;

        return Guid.TryParse(value, out var uuid)
            ? uuid
            : null;
    }
    private static ImportRowDto ToDto(ImportRow row)
    {
        return new ImportRowDto(
            row.Uuid,
            row.RowNumber,
            row.PalletNumber,
            row.Barcode,
            row.SupplierFilmName,
            row.FilmTypeUuid,
            row.FilmType?.Brand,
            row.ThicknessMicron,
            row.WidthMm,
            row.LengthM,
            row.RollCount,
            row.NetWeightKg,
            row.GrossWeightKg,
            row.BatchNumber,
            row.WindDiameterMm,
            row.SpoolDiameterMm,
            row.Comment,
            row.IsValid,
            row.ValidationErrors,
            row.IsSelected
        );
    }

    private const decimal GettelPalletGrossCoefficient = 1.0765m;
}
```
        PalletTypesController.cs
```cs
// RulonFlow.Api/Controllers/PalletTypesController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/pallet-types")]
public class PalletTypesController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public PalletTypesController(RulonFlowDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        var query = _db.PalletTypes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();

            query = query.Where(x =>
                x.Name.Contains(normalizedSearch) ||
                (x.Description != null &&
                 x.Description.Contains(normalizedSearch)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new PalletTypeResponse(
                x.Uuid,
                x.Name,
                x.LengthMm,
                x.WidthMm,
                x.Description,
                x.SortOrder))
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            total,
            totalPages = (int)Math.Ceiling(total / (double)pageSize)
        });
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> GetById(Guid uuid)
    {
        var item = await _db.PalletTypes
            .AsNoTracking()
            .Where(x => x.Uuid == uuid)
            .Select(x => new PalletTypeResponse(
                x.Uuid,
                x.Name,
                x.LengthMm,
                x.WidthMm,
                x.Description,
                x.SortOrder))
            .FirstOrDefaultAsync();

        if (item is null)
            return NotFound();

        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] PalletTypeRequest request)
    {
        var validationError = Validate(request);

        if (validationError is not null)
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = validationError
                }
            });

        var name = BuildName(request.LengthMm, request.WidthMm);

        var nameExists = await _db.PalletTypes
            .AnyAsync(x => x.Name == name);

        if (nameExists)
            return Conflict(new
            {
                error = new
                {
                    code = "DUPLICATE_NAME",
                    message = "Тип паллеты с таким размером уже существует"
                }
            });

        var item = new PalletType
        {
            Uuid = Guid.NewGuid(),
            Name = name,
            LengthMm = request.LengthMm,
            WidthMm = request.WidthMm,
            Description = request.Description?.Trim(),
            SortOrder = request.SortOrder
        };

        _db.PalletTypes.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { uuid = item.Uuid },
            new PalletTypeResponse(
                item.Uuid,
                item.Name,
                item.LengthMm,
                item.WidthMm,
                item.Description,
                item.SortOrder));
    }

    [HttpPut("{uuid:guid}")]
    public async Task<IActionResult> Update(
        Guid uuid,
        [FromBody] PalletTypeRequest request)
    {
        var item = await _db.PalletTypes
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
            return NotFound();

        var validationError = Validate(request);

        if (validationError is not null)
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = validationError
                }
            });

        var name = BuildName(request.LengthMm, request.WidthMm);

        var nameExists = await _db.PalletTypes
            .AnyAsync(x => x.Name == name && x.Uuid != uuid);

        if (nameExists)
            return Conflict(new
            {
                error = new
                {
                    code = "DUPLICATE_NAME",
                    message = "Тип паллеты с таким размером уже существует"
                }
            });

        item.Name = name;
        item.LengthMm = request.LengthMm;
        item.WidthMm = request.WidthMm;
        item.Description = request.Description?.Trim();
        item.SortOrder = request.SortOrder;

        await _db.SaveChangesAsync();

        return Ok(new PalletTypeResponse(
            item.Uuid,
            item.Name,
            item.LengthMm,
            item.WidthMm,
            item.Description,
            item.SortOrder));
    }

    private static string? Validate(PalletTypeRequest request)
    {
        if (request.LengthMm <= 0)
            return "Укажите целую длину поддона больше нуля";

        if (request.WidthMm <= 0)
            return "Укажите целую ширину поддона больше нуля";

        if (request.SortOrder < 0)
            return "Порядок не может быть отрицательным";

        return null;
    }

    private static string BuildName(int lengthMm, int widthMm) =>
        $"{lengthMm}x{widthMm}";
}

public record PalletTypeRequest(
    int LengthMm,
    int WidthMm,
    string? Description,
    int SortOrder);

public record PalletTypeResponse(
    Guid Uuid,
    string Name,
    int LengthMm,
    int WidthMm,
    string? Description,
    int SortOrder);
```
        RolesController.cs
```cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.Admin;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/admin/roles")]
[Authorize(Policy = "Admin")]
public class RolesController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public RolesController(RulonFlowDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] bool? isActive = null)
    {
        IQueryable<Role> query = _db.Roles.AsNoTracking();

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive);

        var items = await query.OrderBy(x => x.Name).ToListAsync();

        var response = items.Select(x => new RoleResponse(
            x.Uuid, x.Name, x.Description, x.IsActive, x.CreatedAt, x.UpdatedAt));

        return Ok(response);
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> Get(Guid uuid)
    {
        var role = await _db.Roles.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (role is null)
            return NotFound();

        return Ok(new RoleResponse(
            role.Uuid, role.Name, role.Description, role.IsActive, role.CreatedAt, role.UpdatedAt));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request)
    {
        var exists = await _db.Roles.AnyAsync(x => x.Name == request.Name);
        if (exists)
            return Conflict(new { error = "role_already_exists", message = "Роль с таким именем уже существует" });

        var role = new Role
        {
            Uuid = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Roles.Add(role);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { uuid = role.Uuid },
            new RoleResponse(
                role.Uuid, role.Name, role.Description, role.IsActive, role.CreatedAt, role.UpdatedAt));
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, [FromBody] UpdateRoleRequest request)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(x => x.Uuid == uuid);
        if (role is null)
            return NotFound();

        var exists = await _db.Roles.AnyAsync(x => x.Name == request.Name && x.Uuid != uuid);
        if (exists)
            return Conflict(new { error = "role_already_exists", message = "Роль с таким именем уже существует" });

        role.Name = request.Name.Trim();
        role.Description = request.Description?.Trim();
        role.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new RoleResponse(
            role.Uuid, role.Name, role.Description, role.IsActive, role.CreatedAt, role.UpdatedAt));
    }

    [HttpPatch("{uuid:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid uuid)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(x => x.Uuid == uuid);
        if (role is null)
            return NotFound();

        role.IsActive = !role.IsActive;
        role.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new RoleResponse(
            role.Uuid, role.Name, role.Description, role.IsActive, role.CreatedAt, role.UpdatedAt));
    }

    [HttpDelete("{uuid:guid}")]
    public async Task<IActionResult> Delete(Guid uuid)
    {
        var role = await _db.Roles
            .Include(x => x.Users)
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (role is null)
            return NotFound();

        // Проверяем, есть ли пользователи с этой ролью
        if (role.Users.Any())
            return BadRequest(new { error = "role_in_use", message = "Нельзя удалить роль, назначенную пользователям" });

        _db.Roles.Remove(role);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
```
        StorageLocationsController.cs
```cs
?using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

public record StorageLocationDto(
    Guid Uuid,
    Guid ZoneUuid,
    string Name,
    string? Description,
    bool IsActive,
    bool IsBlocked,
    string? BlockReason,
    int MaxPallets,
    int PalletCount
);

public record StorageLocationFormValues(
    string Name,
    string? Description,
    bool IsActive,
    bool IsBlocked,
    string? BlockReason,
    int MaxPallets
);

public record GenerateLocationsRequest(
    int Rows,
    int PlacesPerRow,
    int MaxPallets
);

[ApiController]
[Route("api/v1")]
[Authorize(Policy = "WarehouseKeeper")]
public class StorageLocationsController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public StorageLocationsController(RulonFlowDbContext db)
    {
        _db = db;
    }

    [HttpGet("storage-zones/{zoneUuid:guid}/locations")]
    public async Task<IActionResult> GetByZone(Guid zoneUuid)
    {
        var zoneExists = await _db.StorageZones
            .AnyAsync(x => x.Uuid == zoneUuid);

        if (!zoneExists)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "STORAGE_ZONE_NOT_FOUND",
                    message = "Склад не найден."
                }
            });
        }

        var items = await _db.StorageLocations
            .AsNoTracking()
            .Where(x => x.ZoneUuid == zoneUuid)
            .OrderBy(x => x.Name)
            .Select(x => new StorageLocationDto(
                x.Uuid,
                x.ZoneUuid,
                x.Name,
                x.Description,
                x.IsActive,
                x.IsBlocked,
                x.BlockReason,
                x.MaxPallets,
                x.Pallets.Count(p =>
                    p.Status != "shipped" &&
                    p.Status != "cancelled")
            ))
            .ToListAsync();

        return Ok(new { items });
    }

    [HttpPost("storage-zones/{zoneUuid:guid}/locations/generate")]
    public async Task<IActionResult> Generate(
        Guid zoneUuid,
        [FromBody] GenerateLocationsRequest request)
    {
        var zone = await _db.StorageZones
            .FirstOrDefaultAsync(x => x.Uuid == zoneUuid);

        if (zone is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "STORAGE_ZONE_NOT_FOUND",
                    message = "Склад не найден."
                }
            });
        }

        if (request.Rows < 1 || request.Rows > 50)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Количество линий должно быть от 1 до 50."
                }
            });
        }

        if (request.PlacesPerRow < 1 || request.PlacesPerRow > 200)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Количество мест должно быть от 1 до 200."
                }
            });
        }

        var existingNames = await _db.StorageLocations
            .Where(x => x.ZoneUuid == zoneUuid)
            .Select(x => x.Name)
            .ToListAsync();

        var existingSet = existingNames.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var newLocations = new List<StorageLocation>();

        for (var row = 0; row < request.Rows; row++)
        {
            var letter = ((char)('A' + row)).ToString();

            for (var place = 1; place <= request.PlacesPerRow; place++)
            {
                var name = $"{letter}-{place:D2}";

                if (existingSet.Contains(name))
                    continue;

                newLocations.Add(new StorageLocation
                {
                    Uuid = Guid.NewGuid(),
                    ZoneUuid = zoneUuid,
                    Name = name,
                    Description = $"{zone.Name}, линия {letter}, место {place:D2}",
                    IsActive = true,
                    IsBlocked = false,
                    BlockReason = null,
                    MaxPallets = request.MaxPallets <= 0 ? 1 : request.MaxPallets,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (newLocations.Count > 0)
        {
            _db.StorageLocations.AddRange(newLocations);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            created = newLocations.Count,
            skipped = request.Rows * request.PlacesPerRow - newLocations.Count
        });
    }

    [HttpPatch("storage-locations/{uuid:guid}")]
    public async Task<IActionResult> Update(
        Guid uuid,
        [FromBody] StorageLocationFormValues request)
    {
        var item = await _db.StorageLocations
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "STORAGE_LOCATION_NOT_FOUND",
                    message = "Ячейка не найдена."
                }
            });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите код ячейки."
                }
            });
        }

        if (request.MaxPallets < 0)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Вместимость не может быть отрицательной."
                }
            });
        }

        var activePallets = await _db.Pallets
            .CountAsync(x =>
                x.CurrentLocationUuid == uuid &&
                x.Status != "shipped" &&
                x.Status != "cancelled");

        if (request.MaxPallets < activePallets)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "STORAGE_LOCATION_CAPACITY_CONFLICT",
                    message = $"В ячейке уже {activePallets} паллет; нельзя установить вместимость {request.MaxPallets}."
                }
            });
        }

        var name = request.Name.Trim();

        var exists = await _db.StorageLocations
            .AnyAsync(x =>
                x.Uuid != uuid &&
                x.ZoneUuid == item.ZoneUuid &&
                x.Name == name);

        if (exists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "STORAGE_LOCATION_ALREADY_EXISTS",
                    message = "Ячейка с таким кодом уже есть на этом складе."
                }
            });
        }

        item.Name = name;
        item.Description = request.Description;
        item.IsActive = request.IsActive;
        item.IsBlocked = request.IsBlocked;
        item.BlockReason = request.IsBlocked ? request.BlockReason : null;
        item.MaxPallets = request.MaxPallets;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("storage-locations/{uuid:guid}")]
    public async Task<IActionResult> Delete(Guid uuid)
    {
        var item = await _db.StorageLocations
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "STORAGE_LOCATION_NOT_FOUND",
                    message = "Ячейка не найдена."
                }
            });
        }

        var hasPallets = await _db.Pallets
            .AnyAsync(x => x.CurrentLocationUuid == uuid);

        if (hasPallets)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "STORAGE_LOCATION_IN_USE",
                    message = "Нельзя удалить ячейку, в которой есть паллеты."
                }
            });
        }

        _db.StorageLocations.Remove(item);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
```
        StorageZonesController.cs
```cs
?using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

public record StorageZoneDto(
    Guid Uuid,
    string Name,
    string? Description,
    bool IsActive,
    int LocationCount,
    int FreeLocations,
    int BlockedLocations
);

public record StorageZoneFormValues(
    string Name,
    string? Description,
    bool IsActive
);

[ApiController]
[Route("api/v1/storage-zones")]
[Authorize(Policy = "WarehouseKeeper")]
public class StorageZonesController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public StorageZonesController(RulonFlowDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetList()
    {
        var items = await _db.StorageZones
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(z => new StorageZoneDto(
                z.Uuid,
                z.Name,
                z.Description,
                z.IsActive,
                z.Locations.Count,
                z.Locations.Count(l =>
                    l.IsActive &&
                    !l.IsBlocked &&
                    l.Pallets.Count(p =>
                        p.Status != "shipped" &&
                        p.Status != "cancelled") < l.MaxPallets),
                z.Locations.Count(l => l.IsBlocked)
            ))
            .ToListAsync();

        return Ok(new { items });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] StorageZoneFormValues request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите название склада."
                }
            });
        }

        var name = request.Name.Trim();

        var exists = await _db.StorageZones
            .AnyAsync(x => x.Name == name);

        if (exists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "STORAGE_ZONE_ALREADY_EXISTS",
                    message = "Склад с таким названием уже существует."
                }
            });
        }

        var item = new StorageZone
        {
            Uuid = Guid.NewGuid(),
            Name = name,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.StorageZones.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetList),
            new { },
            new StorageZoneDto(item.Uuid, item.Name, item.Description, item.IsActive, 0, 0, 0)
        );
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> Update(
        Guid uuid,
        [FromBody] StorageZoneFormValues request)
    {
        var item = await _db.StorageZones
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "STORAGE_ZONE_NOT_FOUND",
                    message = "Склад не найден."
                }
            });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Укажите название склада."
                }
            });
        }

        var name = request.Name.Trim();

        var exists = await _db.StorageZones
            .AnyAsync(x => x.Uuid != uuid && x.Name == name);

        if (exists)
        {
            return Conflict(new
            {
                error = new
                {
                    code = "STORAGE_ZONE_ALREADY_EXISTS",
                    message = "Склад с таким названием уже существует."
                }
            });
        }

        item.Name = name;
        item.Description = request.Description;
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
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
        UsersController.cs
```cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.Admin;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Policy = "Admin")]
public class UsersController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public UsersController(RulonFlowDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        IQueryable<User> query = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(x => x.Login.Contains(search) || x.FullName.Contains(search));

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive);

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.Login)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var response = items.Select(x => new UserResponse(
            x.Uuid, x.Login, x.FullName, x.IsActive, x.CreatedAt, x.UpdatedAt,
            x.LastLoginAt, x.Roles.Select(r => new UserRoleDto(r.Role.Uuid, r.Role.Name))));

        return Ok(new { items = response, page, pageSize, totalCount = total });
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> Get(Guid uuid)
    {
        var user = await _db.Users.AsNoTracking()
            .Include(x => x.Roles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (user is null)
            return NotFound();

        return Ok(new UserResponse(
            user.Uuid, user.Login, user.FullName, user.IsActive, user.CreatedAt,
            user.UpdatedAt, user.LastLoginAt, user.Roles.Select(r => new UserRoleDto(r.Role.Uuid, r.Role.Name))));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (await _db.Users.AnyAsync(x => x.Login == request.Login))
            return Conflict(new { error = "login_exists", message = "Пользователь с таким логином уже существует" });

        if (!request.RoleUuids.Any())
            return BadRequest(new { error = "no_roles", message = "Хотя бы одна роль должна быть назначена" });

        var roleCount = await _db.Roles.CountAsync(x => x.IsActive && request.RoleUuids.Contains(x.Uuid));
        if (roleCount != request.RoleUuids.Count())
            return BadRequest(new { error = "invalid_roles", message = "Одна или несколько ролей не существуют или неактивны" });

        var user = new User
        {
            Uuid = Guid.NewGuid(),
            Login = request.Login.Trim(),
            FullName = request.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            Roles = request.RoleUuids.Select(r => new UserRole { RoleUuid = r }).ToList()
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { uuid = user.Uuid },
            new UserResponse(
                user.Uuid, user.Login, user.FullName, user.IsActive, user.CreatedAt,
                user.UpdatedAt, user.LastLoginAt, user.Roles.Select(r => new UserRoleDto(r.Role.Uuid, r.Role.Name))));
    }

    [HttpPatch("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Uuid == uuid);
        if (user is null)
            return NotFound();

        if (!request.RoleUuids.Any())
            return BadRequest(new { error = "no_roles", message = "Хотя бы одна роль должна быть назначена" });

        var roleCount = await _db.Roles.CountAsync(x => x.IsActive && request.RoleUuids.Contains(x.Uuid));
        if (roleCount != request.RoleUuids.Count())
            return BadRequest(new { error = "invalid_roles", message = "Одна или несколько ролей не существуют или неактивны" });

        user.FullName = request.FullName.Trim();
        user.Roles = request.RoleUuids.Select(r => new UserRole { RoleUuid = r }).ToList();
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new UserResponse(
            user.Uuid, user.Login, user.FullName, user.IsActive, user.CreatedAt,
            user.UpdatedAt, user.LastLoginAt, user.Roles.Select(r => new UserRoleDto(r.Role.Uuid, r.Role.Name))));
    }

    [HttpPatch("{uuid:guid}/roles")]
    public async Task<IActionResult> AssignRoles(Guid uuid, [FromBody] AssignRolesRequest request)
    {
        var user = await _db.Users
            .Include(x => x.Roles)
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (user is null)
            return NotFound();

        if (!request.RoleUuids.Any())
            return BadRequest(new { error = "no_roles", message = "Хотя бы одна роль должна быть назначена" });

        var roleCount = await _db.Roles.CountAsync(x => x.IsActive && request.RoleUuids.Contains(x.Uuid));
        if (roleCount != request.RoleUuids.Count())
            return BadRequest(new { error = "invalid_roles", message = "Одна или несколько ролей не существуют или неактивны" });

        user.Roles = request.RoleUuids.Select(r => new UserRole { RoleUuid = r }).ToList();
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new UserResponse(
            user.Uuid, user.Login, user.FullName, user.IsActive, user.CreatedAt,
            user.UpdatedAt, user.LastLoginAt, user.Roles.Select(r => new UserRoleDto(r.Role.Uuid, r.Role.Name))));
    }

    [HttpPatch("{uuid:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid uuid)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Uuid == uuid);
        if (user is null)
            return NotFound();

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new UserResponse(
            user.Uuid, user.Login, user.FullName, user.IsActive, user.CreatedAt,
            user.UpdatedAt, user.LastLoginAt, user.Roles.Select(r => new UserRoleDto(r.Role.Uuid, r.Role.Name))));
    }

    [HttpDelete("{uuid:guid}")]
    public async Task<IActionResult> Delete(Guid uuid)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Uuid == uuid);
        if (user is null)
            return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return NoContent();
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
        Admin
            RoleDtos.cs
```cs
namespace RulonFlow.Api.DTOs.Admin;

public record CreateRoleRequest(
    string Name,
    string? Description);

public record UpdateRoleRequest(
    string Name,
    string? Description);

public record RoleResponse(
    Guid Uuid,
    string Name,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
```
            UserDtos.cs
```cs
namespace RulonFlow.Api.DTOs.Admin;

public record CreateUserRequest(
    string Login,
    string FullName,
    string Password,
    IEnumerable<Guid> RoleUuids);

public record UpdateUserRequest(
    string FullName,
    IEnumerable<Guid> RoleUuids);

public record AssignRolesRequest(
    IEnumerable<Guid> RoleUuids);

public record UserResponse(
    Guid Uuid,
    string Login,
    string FullName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? LastLoginAt,
    IEnumerable<UserRoleDto> Roles);

public record UserRoleDto(
    Guid RoleUuid,
    string RoleName);
```
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
?namespace RulonFlow.Api.DTOs.Auth;

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

public record UserDto(
    Guid Uuid,
    string Login,
    string FullName,
    IEnumerable<string> Roles);
```
        FilmBrandAliases
            FilmBrandAliasDto.cs
```cs
namespace RulonFlow.Api.DTOs.FilmBrandAliases;

public record FilmBrandAliasDto(
    Guid Uuid,
    Guid SupplierUuid,
    string SupplierName,
    string SupplierFilmName,
    Guid FilmTypeUuid,
    string FilmBrand,
    bool IsActive
);
```
            FilmBrandAliasFormValues.cs
```cs
namespace RulonFlow.Api.DTOs.FilmBrandAliases;

public record FilmBrandAliasFormValues(
    Guid SupplierUuid,
    string SupplierFilmName,
    Guid FilmTypeUuid,
    bool IsActive
);
```
        FilmTypes
            FilmTypeDto.cs
```cs
namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeDto(
    Guid Uuid,
    string Brand,
    decimal? DensityGcm3,
    string? Description,
    bool IsActive
);
```
            FilmTypeFormValues.cs
```cs
namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeFormValues(
    string Brand,
    decimal? DensityGcm3,
    string? Description,
    bool IsActive
);
```
            FilmTypeParamDto.cs
```cs
?namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeParamDto(
    Guid Uuid,
    Guid FilmTypeUuid,
    string FilmBrand,
    int ThicknessMicron,
    decimal? Surface,
    decimal? Price,
    string CurrencyCode,
    bool IsActive
);
```
            FilmTypeParamFormValues.cs
```cs
namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeParamFormValues(
    int ThicknessMicron,
    decimal? Surface,
    decimal? Price,
    string CurrencyCode,
    bool IsActive
);
```
        ImportReceipts
            ConfirmImportReceiptRequest.cs
```cs
namespace RulonFlow.Api.DTOs.ImportReceipts;

public record ConfirmImportReceiptRequest(
    IReadOnlyList<ConfirmImportRowRequest> Rows
);

public record ConfirmImportRowRequest(
    Guid RowUuid,
    string PalletNumber,
    Guid FilmTypeUuid,
    Guid? PalletTypeUuid,
    int ThicknessMicron,
    int WidthMm,
    int LengthM,
    int RollCount,
    decimal NetWeightKg,
    string? BatchNumber
);
```
            ImportReceiptGroupedDto.cs
```cs
namespace RulonFlow.Api.DTOs.ImportReceipts;

public record ImportReceiptGroupedDto(
    Guid Uuid,
    Guid? SupplierUuid,
    string FileName,
    long FileSizeBytes,
    string? DetectedFormat,
    string Status,
    DateTime CreatedAt,
    IReadOnlyList<ImportPalletDto> Pallets
);

public record ImportPalletDto(
    string PalletNumber,
    Guid? PalletTypeUuid,
    int RollCount,
    decimal NetWeightKg,
    decimal GrossWeightKg,
    IReadOnlyList<string> ValidationErrors,
    IReadOnlyList<ImportRowDto> Rows
);
```
            ImportRowDto.cs
```cs
namespace RulonFlow.Api.DTOs.ImportReceipts;

public record ImportRowDto(
    Guid Uuid,
    int RowNumber,
    string? PalletNumber,
    string? Barcode,
    string? SupplierFilmName,
    Guid? FilmTypeUuid,
    string? FilmBrand,
    int? ThicknessMicron,
    int? WidthMm,
    int? LengthM,
    int? RollCount,
    decimal? NetWeightKg,
    decimal? GrossWeightKg,
    string? BatchNumber,
    int? WindDiameterMm,
    int? SpoolDiameterMm,
    string? Comment,
    bool IsValid,
    string? ValidationErrors,
    bool IsSelected
);
```
    Extensions
        DependencyInjectionExtensions.cs
```cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RulonFlow.Api.Services;
using RulonFlow.Api.Services.ImportReceipts;
using RulonFlow.Api.Services.ImportReceipts.Parsers;
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

        services.AddScoped<IReceiptImportParser, GettelReceiptImportParser>();
        services.AddScoped<IReceiptImportParser, BiaksplenReceiptImportParser>();
        services.AddScoped<IReceiptImportParser, VoterfallReceiptImportParser>();
        services.AddScoped<IReceiptImportParser, ManualReceiptImportParser>();

        services.AddScoped<ImportFormatDetector>();
        services.AddScoped<ReceiptImportParserService>();

        return services;
    }
}
```
    Middleware
        GlobalExceptionMiddleware.cs
```cs
using System.Text.Json;

namespace RulonFlow.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Необработанная ошибка. TraceId: {TraceId}",
                context.TraceIdentifier);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            var response = new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "Внутренняя ошибка сервера. Повторите операцию или обратитесь к администратору.",
                    traceId = context.TraceIdentifier
                }
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(response));
        }
    }
}
```
    Program.cs
```cs
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using RulonFlow.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddRulonFlowInfrastructure(builder.Configuration);
builder.Services.AddRulonFlowApplication();

var jwtKey = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Не задан Jwt:Secret");

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrWhiteSpace(jwtIssuer),
            ValidIssuer = jwtIssuer,

            ValidateAudience = !string.IsNullOrWhiteSpace(jwtAudience),
            ValidAudience = jwtAudience,

            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),

            NameClaimType = "sub",
            RoleClaimType = "role"
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Администратор — полный доступ
    options.AddPolicy("Admin", policy =>
        policy.RequireRole("Администратор"));

    // Начальник склада — управление складом + администрирование
    options.AddPolicy("WarehouseManager", policy =>
        policy.RequireRole("Администратор", "Начальник склада"));

    // Кладовщик — базовый доступ к складским операциям
    options.AddPolicy("WarehouseKeeper", policy =>
        policy.RequireRole("Администратор", "Начальник склада", "Кладовщик"));

    // Просмотр справочников
    options.AddPolicy("ReadOnly", policy =>
        policy.RequireRole("Администратор", "Начальник склада", "Кладовщик"));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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
    <PackageReference Include="ClosedXML" Version="0.105.1" />
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

</Project>
```
    RulonFlow.Api.csproj.user
    RulonFlow.Api.http
    Services
        AuthService.cs
```cs
?using Microsoft.EntityFrameworkCore;
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

        return new LoginResponseDto(
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddHours(lifetimeHours),
            new UserDto(user.Uuid, user.Login, user.FullName, userRoles));
    }
}
```
        ImportReceipts
            ExcelCellReader.cs
```cs
using ClosedXML.Excel;
using System.Globalization;

namespace RulonFlow.Api.Services.ImportReceipts;

public static class ExcelCellReader
{
    public static Dictionary<string, int> ReadHeaders(IXLRange usedRange)
    {
        var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var headerRow = usedRange.FirstRow();

        foreach (var cell in headerRow.CellsUsed())
        {
            var header = NormalizeHeader(cell.GetString());

            if (!string.IsNullOrWhiteSpace(header))
                headers[header] = cell.Address.ColumnNumber;
        }

        return headers;
    }

    public static string NormalizeHeader(string value)
    {
        return value
            .Trim()
            .ToUpperInvariant()
            .Replace(" ", "")
            .Replace("\u00A0", "")
            .Replace("(", "")
            .Replace(")", "")
            .Replace("/", "")
            .Replace(".", "")
            .Replace(",", "");
    }

    public static string NormalizeTypeName(string value)
    {
        return value
            .Trim()
            .ToUpperInvariant()
            .Replace(" ", "")
            .Replace("\u00A0", "")
            .Replace("-", "")
            .Replace("*", "X")
            .Replace("?", "X")
            .Replace("Х", "X");
    }

    public static string? GetText(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        string header)
    {
        var normalized = NormalizeHeader(header);

        if (!headers.TryGetValue(normalized, out var column))
            return null;

        var cell = row.Worksheet.Cell(row.RowNumber(), column);
        var value = cell.GetString().Trim();

        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    public static int? GetInt(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        string header)
    {
        var value = GetText(row, headers, header);

        return int.TryParse(value, out var result) ? result : null;
    }

    public static decimal? GetDecimal(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        string header)
    {
        var value = GetText(row, headers, header);

        if (string.IsNullOrWhiteSpace(value))
            return null;

        value = value
            .Replace("\u00A0", "")
            .Replace(" ", "")
            .Replace(",", ".");

        return decimal.TryParse(
            value,
            NumberStyles.Any,
            CultureInfo.InvariantCulture,
            out var result)
            ? result
            : null;
    }
}
```
            ImportFormatDetector.cs
```cs
using RulonFlow.Api.Services.ImportReceipts.Parsers;

namespace RulonFlow.Api.Services.ImportReceipts;

public class ImportFormatDetector
{
    private readonly List<IReceiptImportParser> _parsers;

    public ImportFormatDetector(IEnumerable<IReceiptImportParser> parsers)
    {
        _parsers = parsers.ToList();
    }

    public string Detect(Dictionary<string, int> headers)
    {
        var parser = _parsers.FirstOrDefault(x => x.CanParse(headers));

        return parser?.FormatName ?? "Manual";
    }
}
```
            Parsers
                BiaksplenReceiptImportParser.cs
```cs
using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public class BiaksplenReceiptImportParser : IReceiptImportParser
{
    public string FormatName => "Biaksplen";

    public bool CanParse(Dictionary<string, int> headers)
    {
        return headers.ContainsKey("ПАЛЛЕТА") &&
               headers.ContainsKey("МАРКАПЛЕНКИ");
    }

    public void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item)
    {
        item.PalletNumber = ExcelCellReader.GetText(row, headers, "Паллета");
        item.SupplierFilmName = ExcelCellReader.GetText(row, headers, "Марка пленки");
        item.ThicknessMicron = ExcelCellReader.GetInt(row, headers, "Толщина пленки");
        item.WidthMm = ExcelCellReader.GetInt(row, headers, "Формат");
        item.RollCount = ExcelCellReader.GetInt(row, headers, "Количество рулонов");
        item.NetWeightKg = ExcelCellReader.GetDecimal(row, headers, "Количество Остаток");
        item.GrossWeightKg = ExcelCellReader.GetDecimal(row, headers, "Вес брутто паллеты");
        item.WindDiameterMm = ExcelCellReader.GetInt(row, headers, "Диаметр намотки");
        item.Comment = ExcelCellReader.GetText(row, headers, "Комментарий заказа");
    }

    public Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes)
    {
        return Task.CompletedTask;
    }
}
```
                GettelReceiptImportParser.cs
```cs
using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public class GettelReceiptImportParser : IReceiptImportParser
{
    private const int GettelSpoolDiameterMm = 152;

    public string FormatName => "Gettel";

    public bool CanParse(Dictionary<string, int> headers)
    {
        return headers.ContainsKey("PALLETNO") &&
               headers.ContainsKey("NETWEIGHTKGSROLL");
    }

    public void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item)
    {
        item.PalletNumber = ExcelCellReader.GetText(row, headers, "PALLET NO.");
        item.Barcode = ExcelCellReader.GetText(row, headers, "BAR CODE");
        item.SupplierFilmName = ExcelCellReader.GetText(row, headers, "DESCRIPTION");
        item.WidthMm = ExcelCellReader.GetInt(row, headers, "WIDTH(MM)");
        item.LengthM = ExcelCellReader.GetInt(row, headers, "LENGTH(M)");
        item.RollCount = ExcelCellReader.GetInt(row, headers, "NO OF ROLLS");
        item.BatchNumber = ExcelCellReader.GetText(row, headers, "LOT NO.");

        item.NetWeightKg = ExcelCellReader.GetDecimal(row, headers, "NET WEIGHT(KGS)/ROLL");
        item.GrossWeightKg = null;

        item.WindDiameterMm = null;
        item.SpoolDiameterMm = GettelSpoolDiameterMm;

        ParseFilmName(item);
    }

    public Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes)
    {
        if (item.PalletTypeUuid.HasValue)
            return Task.CompletedTask;

        var palletType = palletTypes.FirstOrDefault(x =>
            x.LengthMm == 1100 &&
            x.WidthMm == 1100 );

        if (palletType is not null)
        {
            item.PalletTypeUuid = palletType.Uuid;
        }

        return Task.CompletedTask;
    }

    private static void ParseFilmName(ImportRow item)
    {
        if (string.IsNullOrWhiteSpace(item.SupplierFilmName))
            return;

        var parts = item.SupplierFilmName.Split(
            '-',
            StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length < 2)
            return;

        var brand = parts[0].Trim();
        var thicknessText = parts[1].Trim();

        if (int.TryParse(thicknessText, out var thicknessMicron))
        {
            item.ThicknessMicron = thicknessMicron;
            item.Comment = $"Gettel: марка {brand}, толщина {thicknessMicron} мкм";
        }
        else
        {
            item.Comment = $"Gettel: марка {brand}, толщина не распознана ({thicknessText})";
        }
    }
}
```
                IReceiptImportParser.cs
```cs
using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public interface IReceiptImportParser
{
    string FormatName { get; }

    bool CanParse(Dictionary<string, int> headers);

    void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item);

    Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes);
}
```
                ManualReceiptImportParser.cs
```cs
using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public class ManualReceiptImportParser : IReceiptImportParser
{
    public string FormatName => "Manual";

    public bool CanParse(Dictionary<string, int> headers)
    {
        // Ручной режим — резервный, выбирается последним.
        return true;
    }

    public void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item)
    {
        item.SupplierFilmName = FindFirstText(row, headers);
        item.Comment = "Формат не распознан: требуется ручное сопоставление";
        item.IsSelected = false;
    }

    public Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes)
    {
        return Task.CompletedTask;
    }

    private static string? FindFirstText(
        IXLRangeRow row,
        Dictionary<string, int> headers)
    {
        foreach (var column in headers.Values.OrderBy(x => x))
        {
            var value = row.Worksheet
                .Cell(row.RowNumber(), column)
                .GetString()
                .Trim();

            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }
}
```
                VoterfallReceiptImportParser.cs
```cs
```
            ReceiptImportParserService.cs
```cs
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.ImportReceipts;
using RulonFlow.Api.Services.ImportReceipts;
using RulonFlow.Api.Services.ImportReceipts.Parsers;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;
using System.Text.Json;

namespace RulonFlow.Api.Services;

public class ReceiptImportParserService
{
    private readonly RulonFlowDbContext _db;
    private readonly ImportFormatDetector _formatDetector;
    private readonly Dictionary<string, IReceiptImportParser> _parsers;

    public ReceiptImportParserService(
        RulonFlowDbContext db,
        IEnumerable<IReceiptImportParser> parsers)
    {
        _db = db;

        var parserList = parsers.ToList();

        _formatDetector = new ImportFormatDetector(
            parserList.Where(x => x.FormatName != "Manual"));

        _parsers = parserList.ToDictionary(x => x.FormatName);
    }

    public async Task<string> ParseAsync(Guid importFileUuid)
    {
        var importFile = await _db.ImportFiles
            .FirstOrDefaultAsync(x => x.Uuid == importFileUuid)
            ?? throw new InvalidOperationException("Импорт не найден.");

        using var workbook = new XLWorkbook(importFile.StoredFilePath);
        var worksheet = workbook.Worksheets.First();
        var usedRange = worksheet.RangeUsed()
            ?? throw new InvalidOperationException("Файл пустой.");

        var headers = ExcelCellReader.ReadHeaders(usedRange);
        var format = _formatDetector.Detect(headers);

        importFile.DetectedFormat = format;

        var parser = _parsers[format];

        var aliases = await _db.FilmBrandAliases
            .AsNoTracking()
            .Where(x => x.SupplierUuid == importFile.SupplierUuid)
            .ToDictionaryAsync(
                x => ExcelCellReader.NormalizeHeader(x.SupplierFilmName),
                x => x.FilmTypeUuid);

        var palletTypes = await _db.PalletTypes
            .AsNoTracking()
            .ToListAsync();

        var rows = new List<ImportRow>();
        var rowNumber = 1;

        foreach (var row in usedRange.RowsUsed().Skip(1))
        {
            rowNumber++;

            var importRow = new ImportRow
            {
                Uuid = Guid.NewGuid(),
                ImportFileUuid = importFileUuid,
                RowNumber = rowNumber,
                CreatedAt = DateTime.UtcNow,
                IsSelected = true
            };

            var errors = new List<string>();

            parser.Fill(row, headers, importRow);

            if (IsSummaryRow(importRow.PalletNumber, importRow.SupplierFilmName))
                continue;

            await parser.SetDefaultsAsync(
                importRow,
                palletTypes);

            MatchFilmType(importRow, format, aliases, errors);

            importRow.IsValid = errors.Count == 0;
            importRow.ValidationErrors = errors.Count == 0
                ? null
                : JsonSerializer.Serialize(errors);

            rows.Add(importRow);
        }

        await ValidateRollDuplicatesAsync(importFileUuid, rows);

        var existingRows = _db.ImportRows
            .Where(x => x.ImportFileUuid == importFileUuid);

        _db.ImportRows.RemoveRange(existingRows);
        _db.ImportRows.AddRange(rows);

        importFile.Status = rows.Any(x => !x.IsValid)
            ? "validation_failed"
            : "parsed";

        await _db.SaveChangesAsync();

        return format;
    }

    private async Task ValidateRollDuplicatesAsync(
    Guid importFileUuid,
    List<ImportRow> rows)
    {
        var filledRows = rows
            .Where(x => !string.IsNullOrWhiteSpace(x.Barcode))
            .ToList();

        var duplicateRollsInFile = filledRows
            .GroupBy(x => x.Barcode!.Trim())
            .Where(x => x.Count() > 1)
            .SelectMany(x => x)
            .ToHashSet();

        var barcodes = filledRows
            .Select(x => x.Barcode!.Trim())
            .Distinct()
            .ToList();

        var existingRollNumbers = await _db.Rolls
            .AsNoTracking()
            .Where(x => barcodes.Contains(x.RollNumber))
            .Select(x => x.RollNumber)
            .ToListAsync();

        var existingRollNumberSet = existingRollNumbers
            .Select(x => x.Trim())
            .ToHashSet();

        foreach (var row in rows)
        {
            var errors = string.IsNullOrWhiteSpace(row.ValidationErrors)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(
                    row.ValidationErrors!) ?? new List<string>();

            var barcode = row.Barcode?.Trim();

            if (!string.IsNullOrWhiteSpace(barcode))
            {
                if (duplicateRollsInFile.Contains(row))
                {
                    errors.Add("Дубликат штрихкода рулона в файле");
                }

                if (existingRollNumberSet.Contains(barcode))
                {
                    errors.Add("Рулон с таким штрихкодом уже существует");
                }
            }
            
            if (errors.Count > 0)
            {
                row.IsValid = false;
                row.ValidationErrors = JsonSerializer.Serialize(errors);
            }
        }
    }

    private static bool IsSummaryRow(string? palletNumber, string? filmName)
    {
        var pallet = palletNumber?.ToUpperInvariant() ?? string.Empty;
        var film = filmName?.ToUpperInvariant() ?? string.Empty;

        return pallet.Contains("TOTAL") ||
               film.Contains("TOTAL") ||
               pallet.Contains("SUM TOTAL");
    }

    private static void MatchFilmType(
        ImportRow item,
        string format,
        Dictionary<string, Guid> aliases,
        List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(item.SupplierFilmName))
        {
            errors.Add("Не указано название плёнки");
            return;
        }

        var brand = format == "Gettel"
            ? GetGettelBrand(item.SupplierFilmName)
            : item.SupplierFilmName;

        var key = ExcelCellReader.NormalizeHeader(brand);

        if (aliases.TryGetValue(key, out var filmTypeUuid))
        {
            item.FilmTypeUuid = filmTypeUuid;
        }
        else
        {
            errors.Add("Марка не сопоставлена");
        }
    }



    private static string GetGettelBrand(string supplierFilmName)
    {
        var parts = supplierFilmName.Split(
            '-',
            StringSplitOptions.RemoveEmptyEntries);

        return parts.Length > 0
            ? parts[0].Trim()
            : supplierFilmName.Trim();
    }

    public async Task ConfirmAsync(
    Guid importFileUuid,
    Guid createdByUuid,
    ConfirmImportReceiptRequest request)
    {
        var importFile = await _db.ImportFiles
            .Include(x => x.Rows)
            .FirstOrDefaultAsync(x => x.Uuid == importFileUuid)
            ?? throw new InvalidOperationException("Импорт не найден.");

        if (importFile.Status == "confirmed")
        {
            throw new InvalidOperationException(
                "Поступление уже создано по этому импорту.");
        }

        var requestRowUuids = request.Rows
            .Select(x => x.RowUuid)
            .ToHashSet();

        var selectedRows = importFile.Rows
            .Where(x => requestRowUuids.Contains(x.Uuid))
            .ToList();

        if (selectedRows.Count == 0)
        {
            throw new InvalidOperationException(
                "Выберите хотя бы один рулон для создания поступления.");
        }

        if (selectedRows.Any(x => !x.IsValid))
        {
            throw new InvalidOperationException(
                "Невозможно создать поступление: есть строки с ошибками валидации.");
        }

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        try
        {
            var receipt = new MaterialReceipt
            {
                Uuid = Guid.NewGuid(),
                SupplierUuid = importFile.SupplierUuid,
                ReceiptNumber = $"ИМП-{DateTime.UtcNow:yyyyMMdd-HHmmss}",
                ReceiptDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Comment = "Поступление создано из импортированного файла",
                CreatedByUuid = createdByUuid,
                CreatedAt = DateTime.UtcNow
            };

            _db.MaterialReceipts.Add(receipt);

            var palletsByNumber = new Dictionary<string, Pallet>();

            foreach (var row in selectedRows)
            {
                var palletNumber = row.PalletNumber!.Trim();

                if (!palletsByNumber.TryGetValue(
                        palletNumber,
                        out var pallet))
                {
                    pallet = new Pallet
                    {
                        Uuid = Guid.NewGuid(),
                        PalletNumber = palletNumber,
                        PalletTypeUuid = row.PalletTypeUuid,
                        Status = "open",
                        CreatedByUuid = createdByUuid,
                        CreatedAt = DateTime.UtcNow
                    };

                    _db.Pallets.Add(pallet);
                    palletsByNumber[palletNumber] = pallet;
                }

                if (row.ThicknessMicron is null || row.ThicknessMicron <= 0)
                {
                    throw new InvalidOperationException(
                        $"Для рулона {row.Barcode} не указана толщина материала.");
                }

                var roll = new Roll
                {
                    Uuid = Guid.NewGuid(),
                    RollNumber = row.Barcode!.Trim(),

                    // Главное исправление:
                    ReceiptUuid = receipt.Uuid,

                    FilmTypeUuid = row.FilmTypeUuid,
                    ThicknessMicron = row.ThicknessMicron.Value,
                    WidthMm = row.WidthMm,
                    LengthM = row.LengthM,
                    GrossWeightKg = row.GrossWeightKg,
                    NetWeightKg = row.NetWeightKg,
                    BatchNumber = row.BatchNumber,
                    Status = "received",
                    PalletUuid = pallet.Uuid,
                    Comment = row.Comment,
                    CreatedByUuid = createdByUuid,
                    CreatedAt = DateTime.UtcNow
                };

                _db.Rolls.Add(roll);
            }

            importFile.Status = "confirmed";

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
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
        ImportFile.cs
```cs
namespace RulonFlow.Domain.Entities;

public class ImportFile
{
    public Guid Uuid { get; set; }
    public Guid? SupplierUuid { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoredFilePath { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? ContentType { get; set; }
    public string? DetectedFormat { get; set; }
    public string Status { get; set; } = "uploaded";
    public Guid? UploadedByUuid { get; set; }
    public DateTime CreatedAt { get; set; }

    public Supplier? Supplier { get; set; }
    public List<ImportRow> Rows { get; set; } = [];
}
```
        ImportRow.cs
```cs
namespace RulonFlow.Domain.Entities;

public class ImportRow
{
    public Guid Uuid { get; set; }
    public Guid ImportFileUuid { get; set; }
    public int RowNumber { get; set; }

    public string? PalletNumber { get; set; }
    public string? Barcode { get; set; }
    public string? SupplierFilmName { get; set; }

    public Guid? FilmTypeUuid { get; set; }
    public FilmType? FilmType { get; set; }

    public int? ThicknessMicron { get; set; }
    public int? WidthMm { get; set; }
    public int? LengthM { get; set; }
    public int? RollCount { get; set; }

    public decimal? NetWeightKg { get; set; }
    public decimal? GrossWeightKg { get; set; }

    public string? BatchNumber { get; set; }

    public int? WindDiameterMm { get; set; }
    public int? SpoolDiameterMm { get; set; }

    public Guid? PalletTypeUuid { get; set; }
    public PalletType? PalletType { get; set; }

    public string? Comment { get; set; }

    public bool IsValid { get; set; }
    public string? ValidationErrors { get; set; }
    public bool IsSelected { get; set; }

    public DateTime CreatedAt { get; set; }

    public ImportFile ImportFile { get; set; } = null!;
}
```
        MaterialReceipt.cs
```cs
namespace RulonFlow.Domain.Entities;

public class MaterialReceipt
{
    public Guid Uuid { get; set; }

    public Guid? SupplierUuid { get; set; }

    public string ReceiptNumber { get; set; } = string.Empty;

    public DateOnly ReceiptDate { get; set; }

    public string? Comment { get; set; }

    public Guid? CreatedByUuid { get; set; }

    public DateTime CreatedAt { get; set; }
}
```
        Pallet.cs
```cs
namespace RulonFlow.Domain.Entities;

public class Pallet
{
    public Guid Uuid { get; set; }
    public string PalletNumber { get; set; } = string.Empty;
    public Guid? PalletTypeUuid { get; set; }
    public Guid? CurrentLocationUuid { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid CreatedByUuid { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    public PalletType? PalletType { get; set; }
    public StorageLocation? CurrentLocation { get; set; }
}
```
        PalletType.cs
```cs
namespace RulonFlow.Domain.Entities;

public class PalletType
{
    public Guid Uuid { get; set; }

    /// <summary>
    /// Размер поддона в формате «длина x ширина», например 1200x800.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Длина поддона, мм.
    /// </summary>
    public int LengthMm { get; set; }

    /// <summary>
    /// Ширина поддона, мм.
    /// </summary>
    public int WidthMm { get; set; }

    /// <summary>
    /// Тип или назначение поддона: евро, Gettel и т. д.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Порядок отображения в списке выбора.
    /// </summary>
    public int SortOrder { get; set; }

    public List<Pallet> Pallets { get; set; } = [];
}
```
        Role.cs
```cs
namespace RulonFlow.Domain.Entities;

public class Role
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<UserRole> Users { get; set; } = [];
}
```
        Roll.cs
```cs
namespace RulonFlow.Domain.Entities;

public class Roll
{
    public Guid Uuid { get; set; }

    public string RollNumber { get; set; } = string.Empty;

    public Guid? ReceiptUuid { get; set; }

    public Guid? FilmTypeUuid { get; set; }
    public int ThicknessMicron { get; set; }

    public int? WidthMm { get; set; }

    public int? LengthM { get; set; }

    public decimal? GrossWeightKg { get; set; }

    public decimal? NetWeightKg { get; set; }

    public string? BatchNumber { get; set; }

    public string Status { get; set; } = string.Empty;

    public Guid? PalletUuid { get; set; }

    public string? Comment { get; set; }

    public Guid? CreatedByUuid { get; set; }

    public DateTime CreatedAt { get; set; }

    public FilmType? FilmType { get; set; }

    public Pallet? Pallet { get; set; }
}
```
        StorageLocation.cs
```cs
namespace RulonFlow.Domain.Entities;

public class StorageLocation
{
    public Guid Uuid { get; set; }
    public Guid ZoneUuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public int MaxPallets { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public StorageZone Zone { get; set; } = null!;
    public List<Pallet> Pallets { get; set; } = [];
}
```
        StorageZone.cs
```cs
using System.Security.Cryptography.X509Certificates;

namespace RulonFlow.Domain.Entities;

public class StorageZone
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<StorageLocation> Locations { get; set; } = [];
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
?namespace RulonFlow.Domain.Entities;

public class User
{
    public Guid Uuid { get; set; }
    public string Login { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public List<UserRole> Roles { get; set; } = [];
}
```
        UserRole.cs
```cs
namespace RulonFlow.Domain.Entities;

public class UserRole
{
    public Guid UserUuid { get; set; }
    public Guid RoleUuid { get; set; }

    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
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
    Migrations
        001_initial_schema_with_seed.sql
    Persistence
        Migrations
        RulonFlowDbContext.cs
```cs
???using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using System.Security.Cryptography.X509Certificates;

namespace RulonFlow.Infrastructure.Persistence;

public class RulonFlowDbContext : DbContext
{
    public RulonFlowDbContext(DbContextOptions<RulonFlowDbContext> options)
        : base(options)
    {
    }

    public DbSet<FilmType> FilmTypes => Set<FilmType>();
    public DbSet<FilmTypeParam> FilmTypeParams => Set<FilmTypeParam>();
    public DbSet<FilmBrandAlias> FilmBrandAliases => Set<FilmBrandAlias>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Counterparty> Counterparties => Set<Counterparty>();
    public DbSet<DefectReason> DefectReasons => Set<DefectReason>();
    public DbSet<Roll> Rolls => Set<Roll>();
    public DbSet<Pallet> Pallets => Set<Pallet>();
    public DbSet<PalletType> PalletTypes => Set<PalletType>();
    public DbSet<StorageZone> StorageZones => Set<StorageZone>();
    public DbSet<StorageLocation> StorageLocations => Set<StorageLocation>();
    public DbSet<ImportFile> ImportFiles => Set<ImportFile>();
    public DbSet<ImportRow> ImportRows => Set<ImportRow>();
    public DbSet<MaterialReceipt> MaterialReceipts => Set<MaterialReceipt>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FilmType>(entity =>
        {
            entity.ToTable("film_types");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Brand)
                .HasColumnName("brand")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.DensityGcm3)
                .HasColumnName("density_gcm3")
                .HasPrecision(6, 3);

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(x => x.Brand)
                .IsUnique();

            entity.HasMany(x => x.Params)
                .WithOne(x => x.FilmType)
                .HasForeignKey(x => x.FilmTypeUuid)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FilmTypeParam>(entity =>
        {
            entity.ToTable("film_type_params");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.FilmTypeUuid)
                .HasColumnName("film_type_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.ThicknessMicron)
                .HasColumnName("thickness_micron");

            entity.Property(x => x.Surface)
                .HasColumnName("surface")
                .HasPrecision(10, 2);

            entity.Property(x => x.Price)
                .HasColumnName("price")
                .HasPrecision(12, 2);

            entity.Property(x => x.CurrencyCode)
                .HasColumnName("currency_code")
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(x => new { x.FilmTypeUuid, x.ThicknessMicron })
                .IsUnique();
        });

        modelBuilder.Entity<FilmBrandAlias>(entity =>
        {
            entity.ToTable("film_brand_aliases");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.SupplierUuid)
                .HasColumnName("supplier_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.SupplierFilmName)
                .HasColumnName("supplier_film_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.FilmTypeUuid)
                .HasColumnName("film_type_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasOne(x => x.Supplier)
                .WithMany()
                .HasForeignKey(x => x.SupplierUuid);

            entity.HasOne(x => x.FilmType)
                .WithMany()
                .HasForeignKey(x => x.FilmTypeUuid);

            entity.HasIndex(x => new { x.SupplierUuid, x.SupplierFilmName })
                .IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Login).HasColumnName("login").HasMaxLength(100).IsRequired();
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
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

        modelBuilder.Entity<PalletType>(entity =>
        {
            entity.ToTable("pallet_types");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.LengthMm)
                .HasColumnName("length_mm");

            entity.Property(x => x.WidthMm)
                .HasColumnName("width_mm");

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.SortOrder)
                .HasColumnName("sort_order");

            entity.HasIndex(x => x.Name)
                .IsUnique();
        });

        modelBuilder.Entity<Roll>(entity =>
        {
            entity.ToTable("source_rolls");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.RollNumber)
                .HasColumnName("roll_number")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.ReceiptUuid)
                .HasColumnName("receipt_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.FilmTypeUuid)
                .HasColumnName("film_type_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.ThicknessMicron)
                .HasColumnName("thickness_micron");

            entity.Property(x => x.WidthMm)
                .HasColumnName("width_mm");

            entity.Property(x => x.LengthM)
                .HasColumnName("length_m");

            entity.Property(x => x.GrossWeightKg)
                .HasColumnName("gross_weight_kg")
                .HasPrecision(12, 2);

            entity.Property(x => x.NetWeightKg)
                .HasColumnName("net_weight_kg")
                .HasPrecision(12, 2);

            entity.Property(x => x.BatchNumber)
                .HasColumnName("batch_number")
                .HasMaxLength(100);

            entity.Property(x => x.Status)
                .HasColumnName("status")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.PalletUuid)
                .HasColumnName("pallet_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Comment)
                .HasColumnName("comment")
                .HasMaxLength(1000);

            entity.Property(x => x.CreatedByUuid)
                .HasColumnName("created_by_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.HasIndex(x => x.RollNumber)
                .IsUnique();

            entity.HasOne(x => x.FilmType)
                .WithMany()
                .HasForeignKey(x => x.FilmTypeUuid);

            entity.HasOne(x => x.Pallet)
                .WithMany()
                .HasForeignKey(x => x.PalletUuid);
        });

        modelBuilder.Entity<Pallet>(entity =>
        {
            entity.ToTable("pallets");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.PalletNumber).HasColumnName("pallet_number").HasMaxLength(50).IsRequired();
            entity.Property(x => x.PalletTypeUuid).HasColumnName("pallet_type_uuid").HasMaxLength(36);
            entity.Property(x => x.CurrentLocationUuid).HasColumnName("current_location_uuid").HasMaxLength(36);
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(30).IsRequired();
            entity.Property(x => x.CreatedByUuid).HasColumnName("created_by_uuid").HasMaxLength(36);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.ClosedAt).HasColumnName("closed_at");
            entity.HasIndex(x => x.PalletNumber).IsUnique();

            entity.HasOne(x => x.PalletType)
                .WithMany(x => x.Pallets)
                .HasForeignKey(x => x.PalletTypeUuid);

            entity.HasOne(x => x.CurrentLocation)
                .WithMany(x => x.Pallets)
                .HasForeignKey(x => x.CurrentLocationUuid);
        });

        modelBuilder.Entity<StorageZone>(entity =>
        {
            entity.ToTable("storage_zones");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(x => x.Name)
                .IsUnique();

            entity.HasMany(x => x.Locations)
                .WithOne(x => x.Zone)
                .HasForeignKey(x => x.ZoneUuid);
        });

        modelBuilder.Entity<StorageLocation>(entity =>
        {
            entity.ToTable("storage_locations");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.ZoneUuid)
                .HasColumnName("zone_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.IsBlocked)
                .HasColumnName("is_blocked");

            entity.Property(x => x.BlockReason)
                .HasColumnName("block_reason")
                .HasMaxLength(255);

            entity.Property(x => x.MaxPallets)
                .HasColumnName("max_pallets");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(x => new { x.ZoneUuid, x.Name })
                .IsUnique();

            entity.HasOne(x => x.Zone)
                .WithMany(x => x.Locations)
                .HasForeignKey(x => x.ZoneUuid);

            entity.HasMany(x => x.Pallets)
                .WithOne(x => x.CurrentLocation)
                .HasForeignKey(x => x.CurrentLocationUuid);
        });

        modelBuilder.Entity<ImportFile>(entity =>
        {
            entity.ToTable("import_files");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.SupplierUuid).HasColumnName("supplier_uuid").HasMaxLength(36);
            entity.Property(x => x.FileName).HasColumnName("file_name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.StoredFilePath).HasColumnName("stored_file_path").HasMaxLength(500).IsRequired();
            entity.Property(x => x.FileSizeBytes).HasColumnName("file_size_bytes");
            entity.Property(x => x.ContentType).HasColumnName("content_type").HasMaxLength(100);
            entity.Property(x => x.DetectedFormat).HasColumnName("detected_format").HasMaxLength(50);
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(30).IsRequired();
            entity.Property(x => x.UploadedByUuid).HasColumnName("uploaded_by_uuid").HasMaxLength(36);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");

            entity.HasOne(x => x.Supplier)
                .WithMany()
                .HasForeignKey(x => x.SupplierUuid);

            entity.HasMany(x => x.Rows)
                .WithOne(x => x.ImportFile)
                .HasForeignKey(x => x.ImportFileUuid);
        });

        modelBuilder.Entity<ImportRow>(entity =>
        {
            entity.ToTable("import_rows");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.ImportFileUuid).HasColumnName("import_file_uuid").HasMaxLength(36);
            entity.Property(x => x.RowNumber).HasColumnName("row_num");
            entity.Property(x => x.PalletNumber).HasColumnName("pallet_number").HasMaxLength(50);
            entity.Property(x => x.Barcode).HasColumnName("barcode").HasMaxLength(100);
            entity.Property(x => x.SupplierFilmName).HasColumnName("supplier_film_name").HasMaxLength(200);
            entity.Property(x => x.FilmTypeUuid).HasColumnName("film_type_uuid").HasMaxLength(36);
            entity.Property(x => x.ThicknessMicron).HasColumnName("thickness_micron");
            entity.Property(x => x.WidthMm).HasColumnName("width_mm");
            entity.Property(x => x.LengthM).HasColumnName("length_m");
            entity.Property(x => x.RollCount).HasColumnName("roll_count");
            entity.Property(x => x.NetWeightKg).HasColumnName("net_weight_kg").HasPrecision(12, 2);
            entity.Property(x => x.GrossWeightKg).HasColumnName("gross_weight_kg").HasPrecision(12, 2);
            entity.Property(x => x.BatchNumber).HasColumnName("batch_number").HasMaxLength(100);
            entity.Property(x => x.WindDiameterMm).HasColumnName("wind_diameter_mm");
            entity.Property(x => x.SpoolDiameterMm).HasColumnName("spool_diameter_mm");
            entity.Property(x => x.PalletTypeUuid).HasColumnName("pallet_type_uuid").HasMaxLength(36);
            entity.Property(x => x.Comment).HasColumnName("comment").HasMaxLength(1000);
            entity.Property(x => x.IsValid).HasColumnName("is_valid");
            entity.Property(x => x.ValidationErrors).HasColumnName("validation_errors");
            entity.Property(x => x.IsSelected).HasColumnName("is_selected");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.ImportFile).WithMany(x => x.Rows).HasForeignKey(x => x.ImportFileUuid);
            entity.HasOne(x => x.FilmType).WithMany().HasForeignKey(x => x.FilmTypeUuid);
            entity.HasOne(x => x.PalletType).WithMany().HasForeignKey(x => x.PalletTypeUuid).HasConstraintName("FK_import_rows_pallet_types")
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(x => x.PalletTypeUuid).HasDatabaseName("IX_import_rows_pallet_type_uuid");
        });

        modelBuilder.Entity<MaterialReceipt>(entity =>
        {
            entity.ToTable("material_receipts");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.SupplierUuid)
                .HasColumnName("supplier_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.ReceiptNumber)
                .HasColumnName("receipt_number")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.ReceiptDate)
                .HasColumnName("receipt_date");

            entity.Property(x => x.Comment)
                .HasColumnName("comment");

            entity.Property(x => x.CreatedByUuid)
                .HasColumnName("created_by_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(50).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(255);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("users_roles");
            entity.HasKey(x => new { x.UserUuid, x.RoleUuid });

            entity.Property(x => x.UserUuid).HasColumnName("user_uuid").HasMaxLength(36);
            entity.Property(x => x.RoleUuid).HasColumnName("role_uuid").HasMaxLength(36);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Roles)
                .HasForeignKey(x => x.UserUuid)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Role)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.RoleUuid)
                .OnDelete(DeleteBehavior.Cascade);
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
    <PackageReference Include="BCrypt.Net-Next" Version="4.2.0" />
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
RulonFlow.sln
```sln
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-000000000000}") = "RulonFlow.Api", "RulonFlow.Api\RulonFlow.Api.csproj", "{A1B2C3D4-0001-0001-0001-000000000001}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-000000000000}") = "RulonFlow.Application", "RulonFlow.Application\RulonFlow.Application.csproj", "{A1B2C3D4-0002-0002-0002-000000000002}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-000000000000}") = "RulonFlow.Domain", "RulonFlow.Domain\RulonFlow.Domain.csproj", "{A1B2C3D4-0003-0003-0003-000000000003}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-000000000000}") = "RulonFlow.Infrastructure", "RulonFlow.Infrastructure\RulonFlow.Infrastructure.csproj", "{A1B2C3D4-0004-0004-0004-000000000004}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{A1B2C3D4-0001-0001-0001-000000000001}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A1B2C3D4-0001-0001-0001-000000000001}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A1B2C3D4-0001-0001-0001-000000000001}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A1B2C3D4-0001-0001-0001-000000000001}.Release|Any CPU.Build.0 = Release|Any CPU
		{A1B2C3D4-0002-0002-0002-000000000002}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A1B2C3D4-0002-0002-0002-000000000002}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A1B2C3D4-0002-0002-0002-000000000002}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A1B2C3D4-0002-0002-0002-000000000002}.Release|Any CPU.Build.0 = Release|Any CPU
		{A1B2C3D4-0003-0003-0003-000000000003}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A1B2C3D4-0003-0003-0003-000000000003}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A1B2C3D4-0003-0003-0003-000000000003}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A1B2C3D4-0003-0003-0003-000000000003}.Release|Any CPU.Build.0 = Release|Any CPU
		{A1B2C3D4-0004-0004-0004-000000000004}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A1B2C3D4-0004-0004-0004-000000000004}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A1B2C3D4-0004-0004-0004-000000000004}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A1B2C3D4-0004-0004-0004-000000000004}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
EndGlobal
```
RulonFlow.slnx.bak
RulonFlow.Web
    .gigacode
        plans
    .gitignore
    .idea
        .gitignore
        gigaCode
            agentSettings.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="GigaCodeAgentSettings">
    <option name="autoApproveEdits" value="true" />
  </component>
</project>
```
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
        vcs.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="VcsDirectoryMappings">
    <mapping directory="$PROJECT_DIR$/.." vcs="Git" />
  </component>
</project>
```
        workspace.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ChangeListManager">
    <list default="true" id="64f66241-c23b-492a-94ef-9180f7caabdb" name="Changes" comment="">
      <change beforePath="$PROJECT_DIR$/../RulonFlow.Api/Controllers/FilmTypesController.cs" beforeDir="false" afterPath="$PROJECT_DIR$/../RulonFlow.Api/Controllers/FilmTypesController.cs" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/../RulonFlow.Api/DTOs/FilmTypes/FilmTypeParamDto.cs" beforeDir="false" afterPath="$PROJECT_DIR$/../RulonFlow.Api/DTOs/FilmTypes/FilmTypeParamDto.cs" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/App.css" beforeDir="false" afterPath="$PROJECT_DIR$/src/App.css" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/App.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/App.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/index.css" beforeDir="false" afterPath="$PROJECT_DIR$/src/index.css" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/layout/AppLayout.css" beforeDir="false" afterPath="$PROJECT_DIR$/src/layout/AppLayout.css" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/layout/AppLayout.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/layout/AppLayout.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/ComingSoonPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/ComingSoonPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/CounterpartiesPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/CounterpartiesPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/DefectReasonsPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/DefectReasonsPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/FilmBrandAliasesPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/FilmBrandAliasesPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/FilmTypesPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/FilmTypesPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/HomePage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/HomePage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/LoginPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/LoginPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/PalletTypesPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/PalletTypesPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/StorageZonesPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/StorageZonesPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/SuppliersPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/SuppliersPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/WarehouseMapPage.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/WarehouseMapPage.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/src/pages/dictionaries/DictionaryLayout.tsx" beforeDir="false" afterPath="$PROJECT_DIR$/src/pages/dictionaries/DictionaryLayout.tsx" afterDir="false" />
      <change beforePath="$PROJECT_DIR$/../csharp-xaml-export.md" beforeDir="false" afterPath="$PROJECT_DIR$/../csharp-xaml-export.md" afterDir="false" />
    </list>
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
  <component name="Git.Settings">
    <option name="RECENT_GIT_ROOT_PATH" value="$PROJECT_DIR$/.." />
  </component>
  <component name="ProblemsViewState">
    <option name="selectedTabId" value="CurrentFile" />
  </component>
  <component name="ProjectColorInfo">{
  &quot;associatedIndex&quot;: 8
}</component>
  <component name="ProjectId" id="3LaMpeh0yHH20Fg8VG8Q5XqOWty" />
  <component name="ProjectLevelVcsManager">
    <ConfirmationsSetting value="2" id="Add" />
  </component>
  <component name="ProjectViewState">
    <option name="hideEmptyMiddlePackages" value="true" />
    <option name="showLibraryContents" value="true" />
  </component>
  <component name="PropertiesComponent">{
  &quot;keyToString&quot;: {
    &quot;ModuleVcsDetector.initialDetectionPerformed&quot;: &quot;true&quot;,
    &quot;RunOnceActivity.ShowReadmeOnStart&quot;: &quot;true&quot;,
    &quot;RunOnceActivity.TerminalTabsStorage.copyFrom.TerminalArrangementManager.252&quot;: &quot;true&quot;,
    &quot;RunOnceActivity.git.unshallow&quot;: &quot;true&quot;,
    &quot;RunOnceActivity.typescript.service.memoryLimit.init&quot;: &quot;true&quot;,
    &quot;git-widget-placeholder&quot;: &quot;master&quot;,
    &quot;ignore.virus.scanning.warn.message&quot;: &quot;true&quot;,
    &quot;kotlin-language-version-configured&quot;: &quot;true&quot;,
    &quot;last_opened_file_path&quot;: &quot;C:/Users/SizovSV/source/repos/RulonFlow/RulonFlow.Web&quot;,
    &quot;list.type.of.created.stylesheet&quot;: &quot;CSS&quot;,
    &quot;node.js.detected.package.eslint&quot;: &quot;true&quot;,
    &quot;node.js.selected.package.eslint&quot;: &quot;(autodetect)&quot;,
    &quot;nodejs_package_manager_path&quot;: &quot;npm&quot;,
    &quot;settings.editor.selected.configurable&quot;: &quot;giga.code.providers.gigacode&quot;,
    &quot;ts.external.directory.path&quot;: &quot;C:\\Users\\SizovSV\\source\\repos\\RulonFlow\\RulonFlow.Web\\node_modules\\typescript\\lib&quot;,
    &quot;vue.rearranger.settings.migration&quot;: &quot;true&quot;
  }
}</component>
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
      <workItem from="1793687911384" duration="13084000" />
      <workItem from="1793853946748" duration="11780000" />
      <workItem from="1793940978361" duration="1023000" />
      <workItem from="1793958825599" duration="2622000" />
      <workItem from="1794203421823" duration="6289000" />
      <workItem from="1794285836208" duration="16293000" />
      <workItem from="1794379334909" duration="4858000" />
      <workItem from="1794503871233" duration="601000" />
      <workItem from="1794805926095" duration="9816000" />
      <workItem from="1795412047763" duration="7577000" />
      <workItem from="1795439748756" duration="607000" />
      <workItem from="1795501767673" duration="2434000" />
      <workItem from="1795515641543" duration="3518000" />
      <workItem from="1795626067852" duration="242000" />
      <workItem from="1795671991819" duration="1453000" />
    </task>
    <servers />
  </component>
  <component name="TypeScriptGeneratedFilesManager">
    <option name="version" value="3" />
  </component>
</project>
```
    csharp-node-export.md
    CSharpNodeProject.ps1
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
            auth.ts
            client.ts
            counterparties.ts
            defectReasons.ts
            filmBrandAliases.ts
            filmTypeParams.ts
            filmTypes.ts
            importReceipts.ts
            palletTypes.ts
            storage.ts
            suppliers.ts
        App.css
        App.tsx
        assets
            hero.png
            react.svg
            vite.svg
        auth
            AuthContext.tsx
            ProtectedRoute.tsx
            useAuth.ts
        index.css
        layout
            AppLayout.css
            AppLayout.tsx
        main.tsx
        pages
            ComingSoonPage.css
            ComingSoonPage.tsx
            CounterpartiesPage.tsx
            DefectReasonsPage.tsx
            dictionaries
                DictionaryLayout.css
                DictionaryLayout.tsx
            FilmBrandAliasesPage.tsx
            FilmTypeParamsPage.tsx
            FilmTypesPage.tsx
            HomePage.css
            HomePage.tsx
            LoginPage.css
            LoginPage.tsx
            PalletTypesPage.tsx
            ReceiptImportPage.tsx
            SharedPage.css
            StorageZonesPage.tsx
            SuppliersPage.tsx
            technologist
                CuttingJobsPage.tsx
                LaminationJobsPage.tsx
                PrintingJobsPage.tsx
                TechnologistImportPage.tsx
                TechnologistJobsPage.css
                TechnologistLayout.css
                TechnologistLayout.tsx
            WarehouseMapPage.tsx
        ui
            Badge.tsx
            Button.tsx
            Card.tsx
            Input.tsx
            Modal.tsx
            Select.tsx
            Table.tsx
            ui.css
    tsconfig.app.json
    tsconfig.json
    tsconfig.node.json
    vite.config.ts

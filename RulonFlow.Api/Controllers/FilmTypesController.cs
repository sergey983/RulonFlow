using Microsoft.AspNetCore.Mvc;
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
                x.ThicknessMicron,
                x.Surface,
                x.Price,
                x.CurrencyCode,
                x.IsActive
            ))
            .ToListAsync();

        return Ok(new { items });
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
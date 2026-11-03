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
            query = query.Where(x =>
                x.Brand.Contains(search) ||
                x.DisplayName.Contains(search));
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
                x.DisplayName,
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
                x.DisplayName,
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
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? brand
                : request.DisplayName.Trim(),
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
                item.DisplayName,
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
        item.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
            ? brand
            : request.DisplayName.Trim();
        item.DensityGcm3 = request.DensityGcm3;
        item.Description = request.Description;
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(new FilmTypeDto(
            item.Uuid,
            item.Brand,
            item.DisplayName,
            item.DensityGcm3,
            item.Description,
            item.IsActive
        ));
    }
}
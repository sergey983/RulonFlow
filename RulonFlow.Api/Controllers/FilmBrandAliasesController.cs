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
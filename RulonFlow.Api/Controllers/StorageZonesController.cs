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
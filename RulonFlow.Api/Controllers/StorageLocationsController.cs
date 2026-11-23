using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;
using System.Security.Cryptography.X509Certificates;

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
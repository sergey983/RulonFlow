﻿// RulonFlow.Api/Controllers/PalletTypesController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/pallet-types")]
[Authorize]
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
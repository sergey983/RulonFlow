﻿// RulonFlow.Api/Controllers/CounterpartiesController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/counterparties")]
[Authorize]
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
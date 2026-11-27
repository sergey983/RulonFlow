using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.Admin;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/admin/roles")]
[Authorize(Policy = "roles:manage")]
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

        var items = await query
            .OrderBy(x => x.Name)
            .Select(x => new RoleResponse(
                x.Uuid, x.Name, x.Description, x.IsActive, x.CreatedAt, x.UpdatedAt,
                _db.RolePermissions
                    .Where(rp => rp.RoleUuid == x.Uuid)
                    .Select(rp => rp.PermissionUuid)
                    .ToList()
            ))
            .ToListAsync();

        return Ok(items);
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

    // ============================================================
    // Permissions management
    // ============================================================

    /// <summary>
    /// Получить все системные permissions
    /// </summary>
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        var permissions = await _db.Permissions
            .AsNoTracking()
            .OrderBy(p => p.Code)
            .Select(p => new { p.Uuid, p.Code, p.Name, p.Description })
            .ToListAsync();

        return Ok(permissions);
    }

    /// <summary>
    /// Получить permissions роли
    /// </summary>
    [HttpGet("{uuid:guid}/permissions")]
    public async Task<IActionResult> GetRolePermissions(Guid uuid)
    {
        var roleExists = await _db.Roles.AnyAsync(x => x.Uuid == uuid);
        if (!roleExists)
            return NotFound();

        var rolePermissions = await _db.RolePermissions
            .Where(rp => rp.RoleUuid == uuid)
            .AsNoTracking()
            .Select(rp => rp.PermissionUuid)
            .ToListAsync();

        return Ok(rolePermissions);
    }

    /// <summary>
    /// Назначить permissions роли (полная замена)
    /// </summary>
    [HttpPatch("{uuid:guid}/permissions")]
    public async Task<IActionResult> AssignRolePermissions(Guid uuid, [FromBody] AssignPermissionsRequest request)
    {
        var roleExists = await _db.Roles.AnyAsync(x => x.Uuid == uuid);
        if (!roleExists)
            return NotFound();

        var requestedCodes = request.PermissionUuids.ToList();
        if (requestedCodes.Count == 0)
        {
            return BadRequest(new { error = "empty_roles", message = "Хотя бы один permission должен быть назначен" });
        }

        // Валидация — все ли permissionUuids существуют
        var existingCodes = await _db.Permissions
            .Where(p => requestedCodes.Contains(p.Uuid))
            .Select(p => p.Uuid)
            .ToHashSetAsync();

        var invalid = requestedCodes.Except(existingCodes);
        if (invalid.Any())
            return BadRequest(new { error = "invalid_permissions", message = $"Некоторые permissions не существуют: {string.Join(", ", invalid)}" });

        // Удалить старые связи
        var old = await _db.RolePermissions
            .Where(rp => rp.RoleUuid == uuid)
            .ToListAsync();

        if (old.Count > 0)
            _db.RolePermissions.RemoveRange(old);

        // Добавить новые
        var newRps = requestedCodes.Select(code => new RolePermission
        {
            RoleUuid = uuid,
            PermissionUuid = code
        }).ToList();

        await _db.RolePermissions.AddRangeAsync(newRps);
        await _db.SaveChangesAsync();

        return Ok();
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.Admin;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Controllers;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Policy = "users:manage")]
public class UsersController : ControllerBase
{
    private readonly RulonFlowDbContext _db;

    public UsersController(RulonFlowDbContext db) => _db = db;

    private UserResponse ToResponse(User u) =>
        new(u.Uuid, u.Login, u.FullName, u.IsActive, u.CreatedAt,
            u.UpdatedAt, u.LastLoginAt,
            u.Roles.Select(r => new UserRoleDto(r.Role.Uuid, r.Role.Name)));

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
            .Include(x => x.Roles)
            .ThenInclude(x => x.Role)
            .OrderBy(x => x.Login)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var response = items.Select(x => ToResponse(x));

        return Ok(new { items = response, page, pageSize, totalCount = total });
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> Get(Guid uuid)
    {
        var user = await _db.Users.AsNoTracking()
            .Include(x => x.Roles).ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (user is null)
            return NotFound();

        return Ok(ToResponse(user));
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
            ToResponse(user));
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

        // Управляем через UserRoles напрямую — избегаем дубликатов
        var current = await _db.UserRoles.Where(x => x.UserUuid == uuid).ToListAsync();
        var currentUuids = new HashSet<Guid>(current.Select(x => x.RoleUuid));
        var newUuids = new HashSet<Guid>(request.RoleUuids);

        foreach (var e in current.Where(x => !newUuids.Contains(x.RoleUuid)))
            _db.UserRoles.Remove(e);
        foreach (var r in newUuids.Except(currentUuids))
            _db.UserRoles.Add(new UserRole { UserUuid = uuid, RoleUuid = r });

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Перезагружаем с ролями — user.Roles стал неактуален
        var loaded = await _db.Users.AsNoTracking()
            .Include(x => x.Roles).ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        return Ok(ToResponse(loaded));
    }

    [HttpPatch("{uuid:guid}/roles")]
    public async Task<IActionResult> AssignRoles(Guid uuid, [FromBody] AssignRolesRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Uuid == uuid);
        if (user is null)
            return NotFound();

        if (!request.RoleUuids.Any())
            return BadRequest(new { error = "no_roles", message = "Хотя бы одна роль должна быть назначена" });

        var roleCount = await _db.Roles.CountAsync(x => x.IsActive && request.RoleUuids.Contains(x.Uuid));
        if (roleCount != request.RoleUuids.Count())
            return BadRequest(new { error = "invalid_roles", message = "Одна или несколько ролей не существуют или неактивны" });

        var current = await _db.UserRoles.Where(x => x.UserUuid == uuid).ToListAsync();
        var currentUuids = new HashSet<Guid>(current.Select(x => x.RoleUuid));
        var newUuids = new HashSet<Guid>(request.RoleUuids);

        foreach (var e in current.Where(x => !newUuids.Contains(x.RoleUuid)))
            _db.UserRoles.Remove(e);
        foreach (var r in newUuids.Except(currentUuids))
            _db.UserRoles.Add(new UserRole { UserUuid = uuid, RoleUuid = r });

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var loaded = await _db.Users.AsNoTracking()
            .Include(x => x.Roles).ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        return Ok(ToResponse(loaded));
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

        return Ok(ToResponse(user));
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

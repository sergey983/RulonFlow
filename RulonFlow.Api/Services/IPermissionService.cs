using Microsoft.EntityFrameworkCore;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Services;

/// <summary>
/// Служба для проверки разрешений (permissions) пользователя.
/// Разрешения загружаются из БД через роли пользователя.
/// </summary>
public interface IPermissionService
{
    /// <summary>
    /// Проверяет, есть ли у пользователя указанное разрешение.
    /// </summary>
    Task<bool> HasPermissionAsync(Guid userUuid, string permissionCode);

    /// <summary>
    /// Возвращает все коды разрешений пользователя.
    /// </summary>
    Task<HashSet<string>> GetUserPermissionsAsync(Guid userUuid);
}

public class PermissionService : IPermissionService
{
    private readonly RulonFlowDbContext _db;

    public PermissionService(RulonFlowDbContext db) => _db = db;

    public async Task<bool> HasPermissionAsync(Guid userUuid, string permissionCode)
    {
        return await _db.Roles
            .Where(r => r.Users.Any(ur => ur.UserUuid == userUuid) && r.IsActive)
            .Join(_db.RolePermissions,
                role => role.Uuid,
                rp => rp.RoleUuid,
                (role, rp) => rp.PermissionUuid)
            .Join(_db.Permissions,
                permUuid => permUuid,
                p => p.Uuid,
                (permUuid, p) => p.Code)
            .AnyAsync(p => p == permissionCode);
    }

    public async Task<HashSet<string>> GetUserPermissionsAsync(Guid userUuid)
    {
        return await _db.Roles
            .Where(r => r.Users.Any(ur => ur.UserUuid == userUuid) && r.IsActive)
            .Join(_db.RolePermissions,
                role => role.Uuid,
                rp => rp.RoleUuid,
                (role, rp) => rp.PermissionUuid)
            .Join(_db.Permissions,
                permUuid => permUuid,
                p => p.Uuid,
                (permUuid, p) => p.Code)
            .ToHashSetAsync();
    }
}

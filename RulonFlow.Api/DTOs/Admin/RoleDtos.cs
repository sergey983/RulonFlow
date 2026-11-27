namespace RulonFlow.Api.DTOs.Admin;

public record CreateRoleRequest(
    string Name,
    string? Description);

public record UpdateRoleRequest(
    string Name,
    string? Description);

public record RoleResponse(
    Guid Uuid,
    string Name,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IEnumerable<Guid> Permissions = null!);

public record AssignPermissionsRequest(
    IEnumerable<Guid> PermissionUuids);

namespace RulonFlow.Api.DTOs.Admin;

public record CreateUserRequest(
    string Login,
    string FullName,
    string Password,
    IEnumerable<Guid> RoleUuids);

public record UpdateUserRequest(
    string FullName,
    IEnumerable<Guid> RoleUuids);

public record AssignRolesRequest(
    IEnumerable<Guid> RoleUuids);

public record UserResponse(
    Guid Uuid,
    string Login,
    string FullName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? LastLoginAt,
    IEnumerable<UserRoleDto> Roles);

public record UserRoleDto(
    Guid RoleUuid,
    string RoleName);

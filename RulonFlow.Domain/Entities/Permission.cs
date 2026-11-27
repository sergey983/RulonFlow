namespace RulonFlow.Domain.Entities;

public class Permission
{
    public Guid Uuid { get; set; }
    public string Code { get; set; } = string.Empty; // e.g. "users:manage"
    public string Name { get; set; } = string.Empty;  // human-readable name
    public string Description { get; set; } = string.Empty;

    public List<RolePermission> RolePermissions { get; set; } = [];
}

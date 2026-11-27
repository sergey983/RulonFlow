namespace RulonFlow.Domain.Entities;

public class RolePermission
{
    public Guid RoleUuid { get; set; }
    public Guid PermissionUuid { get; set; }

    public Role Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}

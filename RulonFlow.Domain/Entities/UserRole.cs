namespace RulonFlow.Domain.Entities;

public class UserRole
{
    public Guid UserUuid { get; set; }
    public Guid RoleUuid { get; set; }

    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}

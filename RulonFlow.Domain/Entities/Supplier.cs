// RulonFlow.Domain/Entities/Supplier.cs
// Supplier.cs
public class Supplier
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Inn { get; set; }
    public bool IsActive { get; set; } = true;
}
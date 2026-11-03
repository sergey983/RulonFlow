// RulonFlow.Domain/Entities/Counterparty.cs
namespace RulonFlow.Domain.Entities;

public class Counterparty
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Inn { get; set; }
    public string? Kpp { get; set; }
    public string? LegalAddressText { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
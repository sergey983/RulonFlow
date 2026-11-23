namespace RulonFlow.Domain.Entities;

public class MaterialReceipt
{
    public Guid Uuid { get; set; }

    public Guid? SupplierUuid { get; set; }

    public string ReceiptNumber { get; set; } = string.Empty;

    public DateOnly ReceiptDate { get; set; }

    public string? Comment { get; set; }

    public Guid? CreatedByUuid { get; set; }

    public DateTime CreatedAt { get; set; }
}
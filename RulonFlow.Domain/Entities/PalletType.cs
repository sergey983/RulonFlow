namespace RulonFlow.Domain.Entities;

public class PalletType
{
    public Guid Uuid { get; set; }

    /// <summary>
    /// Размер поддона в формате «длина x ширина», например 1200x800.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Длина поддона, мм.
    /// </summary>
    public int LengthMm { get; set; }

    /// <summary>
    /// Ширина поддона, мм.
    /// </summary>
    public int WidthMm { get; set; }

    /// <summary>
    /// Тип или назначение поддона: евро, Gettel и т. д.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Порядок отображения в списке выбора.
    /// </summary>
    public int SortOrder { get; set; }

    public List<Pallet> Pallets { get; set; } = [];
}
namespace RulonFlow.Domain.Entities;

public class FilmType
{
    public Guid Uuid { get; set; }
    public string Brand { get; set; } = string.Empty;
    public decimal? DensityGcm3 { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<FilmTypeParam> Params { get; set; } = [];
}
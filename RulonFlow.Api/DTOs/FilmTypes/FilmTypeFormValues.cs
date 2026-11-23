namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeFormValues(
    string Brand,
    decimal? DensityGcm3,
    string? Description,
    bool IsActive
);
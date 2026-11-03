namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeFormValues(
    string Brand,
    string DisplayName,
    decimal? DensityGcm3,
    string? Description,
    bool IsActive
);
namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeDto(
    Guid Uuid,
    string Brand,
    decimal? DensityGcm3,
    string? Description,
    bool IsActive
);
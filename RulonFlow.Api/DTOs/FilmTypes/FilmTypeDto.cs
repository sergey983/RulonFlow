namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeDto(
    Guid Uuid,
    string Brand,
    string DisplayName,
    decimal? DensityGcm3,
    string? Description,
    bool IsActive
);
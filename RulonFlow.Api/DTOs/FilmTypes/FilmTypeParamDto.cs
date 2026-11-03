namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeParamDto(
    Guid Uuid,
    Guid FilmTypeUuid,
    int ThicknessMicron,
    decimal? Surface,
    decimal? Price,
    string CurrencyCode,
    bool IsActive
);
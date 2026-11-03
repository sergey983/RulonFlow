namespace RulonFlow.Api.DTOs.FilmTypes;

public record FilmTypeParamFormValues(
    int ThicknessMicron,
    decimal? Surface,
    decimal? Price,
    string CurrencyCode,
    bool IsActive
);
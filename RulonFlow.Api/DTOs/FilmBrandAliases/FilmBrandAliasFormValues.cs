namespace RulonFlow.Api.DTOs.FilmBrandAliases;

public record FilmBrandAliasFormValues(
    Guid SupplierUuid,
    string SupplierFilmName,
    Guid FilmTypeUuid,
    bool IsActive
);
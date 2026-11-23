const baseUrl = "/api/v1/film-brand-aliases";

export type FilmBrandAlias = {
    uuid: string;
    supplierUuid: string;
    supplierName: string;
    supplierFilmName: string;
    filmTypeUuid: string;
    filmBrand: string;
    isActive: boolean;
};

export type FilmBrandAliasFormValues = {
    supplierUuid: string;
    supplierFilmName: string;
    filmTypeUuid: string;
    isActive: boolean;
};

export async function getFilmBrandAliases(): Promise<FilmBrandAlias[]> {
    const res = await fetch(`${baseUrl}?pageSize=200`);
    if (!res.ok) throw new Error("Не удалось загрузить соответствия марок");

    const data = await res.json();
    return data.items;
}

export async function createFilmBrandAlias(
    values: FilmBrandAliasFormValues
): Promise<FilmBrandAlias> {
    const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
    });

    if (!res.ok) throw new Error("Не удалось создать соответствие");
    return res.json();
}

export async function deleteFilmBrandAlias(uuid: string): Promise<void> {
    const res = await fetch(`${baseUrl}/${uuid}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Не удалось удалить соответствие");
}
const baseUrl = "/api/v1/pallet-types";

export interface PalletType {
    uuid: string;
    name: string;
    lengthMm: number;
    widthMm: number;
    description: string | null;
    sortOrder: number;
}

export interface PalletTypeFormValues {
    name: string;
    lengthMm: number;
    widthMm: number;
    description: string | null;
    sortOrder: number;
}

export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Ошибка запроса");
    }

    return response.json() as Promise<T>;
}

export async function getPalletTypes(
    page = 1,
    pageSize = 100,
): Promise<PagedResult<PalletType>> {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    return request<PagedResult<PalletType>>(`${baseUrl}?${params}`);
}

export async function createPalletType(
    values: PalletTypeFormValues,
): Promise<PalletType> {
    return request<PalletType>(baseUrl, {
        method: "POST",
        body: JSON.stringify(values),
    });
}

export async function updatePalletType(
    uuid: string,
    values: PalletTypeFormValues,
): Promise<PalletType> {
    return request<PalletType>(`${baseUrl}/${uuid}`, {
        method: "PUT",
        body: JSON.stringify(values),
    });
}
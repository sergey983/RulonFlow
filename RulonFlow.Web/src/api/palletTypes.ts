import { api } from './client';

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

export async function getPalletTypes(
    page = 1,
    pageSize = 100,
): Promise<PagedResult<PalletType>> {
    const res = await api.get<PagedResult<PalletType>>('/pallet-types', {
        params: { page, pageSize }
    });
    return res.data;
}

export async function createPalletType(
    values: PalletTypeFormValues,
): Promise<PalletType> {
    const res = await api.post<PalletType>('/pallet-types', values);
    return res.data;
}

export async function updatePalletType(
    uuid: string,
    values: PalletTypeFormValues,
): Promise<PalletType> {
    const res = await api.put<PalletType>(`/pallet-types/${uuid}`, values);
    return res.data;
}
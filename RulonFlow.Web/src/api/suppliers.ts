import { api } from './client';

export interface Supplier {
    uuid: string;
    name: string;
    inn?: string | null;
    isActive: boolean;
}

export interface SupplierCreateRequest {
    name: string;
    inn?: string | null;
    isActive: boolean;
}

export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
}

export const getSuppliers = () =>
    api.get<PagedResult<Supplier>>('/suppliers').then(r => r.data);

export const createSupplier = (data: SupplierCreateRequest) =>
    api.post<Supplier>('/suppliers', data).then(r => r.data);

export const updateSupplier = (uuid: string, data: SupplierCreateRequest) =>
    api.patch<Supplier>(`/suppliers/${uuid}`, data).then(r => r.data);
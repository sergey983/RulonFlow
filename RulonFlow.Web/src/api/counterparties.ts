import { api } from './client';

export interface Counterparty {
    uuid: string;
    name: string;
    inn?: string | null;
    kpp?: string | null;
    legalAddressText?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
}

export interface CounterpartyCreateRequest {
    name: string;
    inn?: string | null;
    kpp?: string | null;
    legalAddressText?: string | null;
    isActive: boolean;
}

export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
}

export const getCounterparties = () =>
    api.get<PagedResult<Counterparty>>('/counterparties').then(r => r.data);

export const createCounterparty = (data: CounterpartyCreateRequest) =>
    api.post<Counterparty>('/counterparties', data).then(r => r.data);

export const updateCounterparty = (
    uuid: string,
    data: CounterpartyCreateRequest
) =>
    api.patch<Counterparty>(`/counterparties/${uuid}`, data).then(r => r.data);
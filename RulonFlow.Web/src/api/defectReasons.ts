import { api } from './client';

export interface DefectReason {
    uuid: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt?: string | null;
}

export interface DefectReasonCreateRequest {
    name: string;
    description?: string | null;
    isActive: boolean;
    sortOrder: number;
}

export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
}

export const getDefectReasons = () =>
    api.get<PagedResult<DefectReason>>('/defect-reasons').then(r => r.data);

export const createDefectReason = (data: DefectReasonCreateRequest) =>
    api.post<DefectReason>('/defect-reasons', data).then(r => r.data);

export const updateDefectReason = (
    uuid: string,
    data: DefectReasonCreateRequest
) =>
    api.patch<DefectReason>(`/defect-reasons/${uuid}`, data).then(r => r.data);
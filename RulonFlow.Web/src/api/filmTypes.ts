import { api } from './client';

export interface FilmType {
    uuid: string;
    brand: string;
    densityGcm3: number | null;
    description: string | null;
    isActive: boolean;
}

export interface FilmTypeFormValues {
    brand: string;
    densityGcm3: number | null;
    description: string | null;
    isActive: boolean;
}

export interface FilmTypeParam {
    uuid: string;
    filmTypeUuid: string;
    thicknessMicron: number;
    surface: number | null;
    price: number | null;
    currencyCode: string;
    isActive: boolean;
}

export interface FilmTypeParamFormValues {
    thicknessMicron: number;
    surface: number | null;
    price: number | null;
    currencyCode: string;
    isActive: boolean;
}

export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
}

export const getFilmTypes = () =>
    api.get<PagedResult<FilmType>>('/film-types').then(r => r.data);

export const createFilmType = (data: FilmTypeFormValues) =>
    api.post<FilmType>('/film-types', data).then(r => r.data);

export const updateFilmType = (uuid: string, data: FilmTypeFormValues) =>
    api.patch<FilmType>(`/film-types/${uuid}`, data).then(r => r.data);

export const getFilmTypeParams = (filmTypeUuid: string) =>
    api
        .get<PagedResult<FilmTypeParam>>(
            `/film-types/${filmTypeUuid}/params`
        )
        .then(r => r.data);

export const createFilmTypeParam = (
    filmTypeUuid: string,
    data: FilmTypeParamFormValues
) =>
    api
        .post<FilmTypeParam>(`/film-types/${filmTypeUuid}/params`, data)
        .then(r => r.data);

export const updateFilmTypeParam = (
    filmTypeUuid: string,
    paramUuid: string,
    data: FilmTypeParamFormValues
) =>
    api
        .patch<FilmTypeParam>(
            `/film-types/${filmTypeUuid}/params/${paramUuid}`,
            data
        )
        .then(r => r.data);
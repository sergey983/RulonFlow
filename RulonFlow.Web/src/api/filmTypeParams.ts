import { api } from './client';

export interface FilmTypeParam {
    uuid: string;
    filmTypeUuid: string;
    filmBrand: string;
    thicknessMicron: number;
    surface: number | null;
    price: number | null;
    currencyCode: string;
    isActive: boolean;
}

export interface FilmTypeParamFormValues {
    filmTypeUuid: string;
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

export const getFilmTypeParams = (page = 1, pageSize = 200) =>
    api.get<PagedResult<FilmTypeParam>>(`/film-types/params?page=${page}&pageSize=${pageSize}`).then(r => r.data);

export const createFilmTypeParam = (data: FilmTypeParamFormValues) =>
    api.post<FilmTypeParam>('/film-types/params', data).then(r => r.data);

export const updateFilmTypeParam = (uuid: string, data: FilmTypeParamFormValues) =>
    api.patch<FilmTypeParam>(`/film-types/params/${uuid}`, data).then(r => r.data);

export const deleteFilmTypeParam = (uuid: string) =>
    api.delete(`/film-types/params/${uuid}`);

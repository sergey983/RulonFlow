import { api } from './client';

export interface ImportFileDto {
    uuid: string;
    supplierUuid?: string | null;
    fileName: string;
    fileSizeBytes: number;
    detectedFormat?: string | null;
    status: string;
    createdAt: string;
}

export interface ImportRowDto {
    uuid: string;
    rowNumber: number;
    palletNumber?: string | null;
    barcode?: string | null;
    supplierFilmName?: string | null;
    filmTypeUuid?: string | null;
    filmBrand?: string | null;
    thicknessMicron?: number | null;
    widthMm?: number | null;
    lengthM?: number | null;
    rollCount?: number | null;
    netWeightKg?: number | null;
    grossWeightKg?: number | null;
    batchNumber?: string | null;
    windDiameterMm?: number | null;
    spoolDiameterMm?: number | null;
    palletTypeUuid?: string | null;
    comment?: string | null;
    isValid: boolean;
    validationErrors?: string | null;
}

export interface ImportPalletDto {
    palletNumber: string;
    palletTypeUuid?: string | null;
    rollCount: number;
    netWeightKg: number;
    grossWeightKg: number;
    validationErrors?: string[] | null;
    rows: ImportRowDto[];
}

export interface ImportFileDetails {
    uuid: string;
    supplierUuid?: string | null;
    fileName: string;
    fileSizeBytes: number;
    detectedFormat?: string | null;
    status: string;
    createdAt: string;
    pallets: ImportPalletDto[];
}

export interface ConfirmImportRowRequest {
    rowUuid: string;
    palletNumber: string;
    filmTypeUuid: string;
    palletTypeUuid: string;
    thicknessMicron: number;
    widthMm: number;
    lengthM: number;
    rollCount: number;
    netWeightKg: number;
    grossWeightKg?: number | null;
    batchNumber?: string | null;
    comment?: string | null;
}

export interface ConfirmImportReceiptRequest {
    rows: ConfirmImportRowRequest[];
}

export class ImportConfirmationError extends Error {
    validationErrors: { rowUuid?: string; palletNumber?: string; code?: string; message: string }[];

    constructor(
        message: string,
        validationErrors: { rowUuid?: string; palletNumber?: string; code?: string; message: string }[] = []
    ) {
        super(message);
        this.name = "ImportConfirmationError";
        this.validationErrors = validationErrors;
    }
}

// ============================================================
// Legacy API — uses raw fetch with access token
// ============================================================

export async function confirmImportReceipt(
    importUuid: string,
    request: ConfirmImportReceiptRequest,
    accessToken: string,
): Promise<void> {
    if (!accessToken) {
        throw new Error("Пользователь не авторизован. Войдите в систему.");
    }

    const response = await fetch(
        `/api/v1/import/receipts/${importUuid}/confirm`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(request),
        },
    );

    if (response.ok) {
        return;
    }

    const body = await response
        .json()
        .catch(() => null);

    const apiError = body?.error;

    const validationErrors: { rowUuid?: string; palletNumber?: string; code?: string; message: string }[] =
        apiError?.details?.map(item => ({
            rowUuid: item.rowUuid,
            palletNumber: item.palletNumber,
            code: item.code,
            message: item.message ?? "Ошибка валидации строки",
        })) ?? [];

    throw new ImportConfirmationError(
        apiError?.message ??
        `Не удалось создать поступление: HTTP ${response.status}`,
        validationErrors
    );
}

// ============================================================
// Modern API — uses axios with Bearer interceptor
// ============================================================

export async function uploadImportReceipt(
    file: File,
    supplierUuid: string
): Promise<ImportFileDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplierUuid', supplierUuid);

    const res = await api.post<ImportFileDto>('/import/receipts/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
}

export async function parseImportReceipt(importUuid: string): Promise<void> {
    await api.post(`/import/receipts/${importUuid}/parse`);
}

export async function getImportReceiptDetails(
    importUuid: string
): Promise<ImportFileDetails> {
    const res = await api.get<ImportFileDetails>(`/import/receipts/${importUuid}`);
    return res.data;
}

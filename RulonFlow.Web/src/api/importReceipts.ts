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

export interface ImportValidationError {
    rowUuid?: string;
    rowNumber?: number;
    palletNumber?: string;
    code?: string;
    message: string;
}

interface ApiErrorDetail {
    rowUuid?: string;
    rowNumber?: number;
    palletNumber?: string;
    code?: string;
    message?: string;
}

interface ApiErrorBody {
    error?: {
        code?: string;
        message?: string;
        details?: ApiErrorDetail[];
    };
}

export class ImportConfirmationError extends Error {
    validationErrors: ImportValidationError[];

    constructor(
        message: string,
        validationErrors: ImportValidationError[] = []
    ) {
        super(message);
        this.name = "ImportConfirmationError";
        this.validationErrors = validationErrors;
    }
}

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
        .catch(() => null) as ApiErrorBody | null;

    const apiError = body?.error;

    const validationErrors: ImportValidationError[] =
        apiError?.details?.map(item => ({
            rowUuid: item.rowUuid,
            rowNumber: item.rowNumber,
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
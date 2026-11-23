import { useCallback, useEffect, useState } from "react";
import type { Supplier } from "../api/suppliers";
import {createPalletType, getPalletTypes,} from "../api/palletTypes";
import type { PalletType } from "../api/palletTypes";
import {confirmImportReceipt, type ConfirmImportReceiptRequest,} from "../api/importReceipts";
import { getAccessToken } from "../api/auth";

interface ImportFileResult {
    uuid: string;
    supplierUuid?: string | null;
    fileName: string;
    fileSizeBytes: number;
    detectedFormat?: string | null;
    status: string;
    createdAt: string;
}

interface ImportRow {
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

interface ImportPallet {
    palletNumber: string;
    palletTypeUuid?: string | null;
    rollCount: number;
    netWeightKg: number;
    grossWeightKg: number;
    validationErrors?: string[] | null;
    rows: ImportRow[];
}

interface ImportFileDetails extends ImportFileResult {
    pallets: ImportPallet[];
}

export default function ReceiptImportPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierUuid, setSupplierUuid] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<ImportFileResult | null>(null);
    const [pallets, setPallets] = useState<ImportPallet[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);

    const [showPalletTypeForm, setShowPalletTypeForm] = useState(false);
    const [palletTypeLength, setPalletTypeLength] = useState("");
    const [palletTypeWidth, setPalletTypeWidth] = useState("");
    const [palletTypeDescription, setPalletTypeDescription] = useState("");
    const [palletTypeSortOrder, setPalletTypeSortOrder] = useState("0");
    const [palletTypeError, setPalletTypeError] = useState<string | null>(null);
    const [savingPalletType, setSavingPalletType] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);

    const loadDictionaries = useCallback(async () => {
        try {
            const response = await fetch(
                "/api/v1/suppliers?pageSize=200&isActive=true",
            );

            if (!response.ok) {
                throw new Error();
            }

            const data = await response.json();
            setSuppliers(data.items);
        } catch {
            setError("Не удалось загрузить справочники");
        }
        try {
            const palletTypesData = await getPalletTypes(1, 200);

            setPalletTypes(palletTypesData.items);
        } catch {
            setError("Не удалось загрузить справочник поддонов");
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDictionaries();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadDictionaries]);

    async function upload() {
        if (!file || !supplierUuid) return;

        const form = new FormData();
        form.append("file", file);
        form.append("supplierUuid", supplierUuid);

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                "/api/v1/import/receipts/file",
                {
                    method: "POST",
                    body: form,
                },
            );

            if (!response.ok) {
                throw new Error("Не удалось загрузить файл");
            }

            const uploaded =
                await response.json() as ImportFileResult;

            setResult(uploaded);
            setPallets([]);
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Не удалось загрузить файл",
            );
        } finally {
            setLoading(false);
        }
    }

    async function parse() {
        if (!result?.uuid) return;

        setLoading(true);
        setError(null);

        try {
            const parseResponse = await fetch(
                `/api/v1/import/receipts/${result.uuid}/parse`,
                { method: "POST" },
            );

            if (!parseResponse.ok) {
                throw new Error("Не удалось разобрать файл");
            }

            const parsed =
                await parseResponse.json() as ImportFileResult;

            setResult({
                ...result,
                ...parsed,
            });

            const rowsResponse = await fetch(
                `/api/v1/import/receipts/${result.uuid}`,
            );

            if (!rowsResponse.ok) {
                throw new Error(
                    "Не удалось загрузить строки импорта",
                );
            }

            const rowsData =
                await rowsResponse.json() as ImportFileDetails;

            const normalizedPallets = rowsData.pallets.map(pallet => ({
                ...pallet,
                rows: pallet.rows.map(row => ({
                    ...row,
                    palletTypeUuid:
                        row.palletTypeUuid ??
                        pallet.palletTypeUuid ??
                        null,
                })),
            }));

            setPallets(normalizedPallets);
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Не удалось разобрать файл",
            );
        } finally {
            setLoading(false);
        }
    }

    function updatePalletType(palletNumber: string, palletTypeUuid: string | null,) {
        setPallets(prev =>
            prev.map(pallet =>
                pallet.palletNumber === palletNumber
                    ? {
                        ...pallet,
                        palletTypeUuid,
                        rows: pallet.rows.map(row => ({
                            ...row,
                            palletTypeUuid,
                        })),
                    }
                    : pallet,
            ),
        );
    }
    async function createPalletTypeItem() {
        const lengthMm = Number(palletTypeLength);
        const widthMm = Number(palletTypeWidth);
        const sortOrder = Number(palletTypeSortOrder || 0);

        if (!Number.isInteger(lengthMm) || lengthMm <= 0) {
            setPalletTypeError("Укажите целую длину поддона");
            return;
        }

        if (!Number.isInteger(widthMm) || widthMm <= 0) {
            setPalletTypeError("Укажите целую ширину поддона");
            return;
        }

        if (!Number.isInteger(sortOrder) || sortOrder < 0) {
            setPalletTypeError("Укажите целое значение порядка");
            return;
        }

        setSavingPalletType(true);
        setPalletTypeError(null);

        try {
            const created = await createPalletType({
                name: `${lengthMm}x${widthMm}`,
                lengthMm,
                widthMm,
                description: palletTypeDescription.trim() || null,
                sortOrder,
            });

            setPalletTypes(prev => [...prev, created]);
            setShowPalletTypeForm(false);

            setPalletTypeLength("");
            setPalletTypeWidth("");
            setPalletTypeDescription("");
            setPalletTypeSortOrder("0");
        } catch (e) {
            setPalletTypeError(
                e instanceof Error
                    ? e.message
                    : "Не удалось создать тип поддона",
            );
        } finally {
            setSavingPalletType(false);
        }
    }

    function canAddRow(row: ImportRow): boolean {
        return Boolean(
            row.filmTypeUuid &&
            row.palletNumber &&
            row.palletTypeUuid &&
            row.thicknessMicron &&
            row.widthMm &&
            row.lengthM &&
            row.rollCount &&
            row.netWeightKg &&
            row.netWeightKg > 0,
        );
    }

    function getRowValidationErrors(row: ImportRow): string[] {
        if (!row.validationErrors) {
            return [];
        }

        return row.validationErrors
            .split(";")
            .map(message => message.trim())
            .filter(Boolean);
    }

    function isRowReady(row: ImportRow): boolean {
        return (
            canAddRow(row) &&
            row.isValid !== false &&
            getRowValidationErrors(row).length === 0
        );
    }

    function getPalletValidationErrors(pallet: ImportPallet): string[] {
        return pallet.validationErrors ?? [];
    }

    const allRows = pallets.flatMap(
        pallet => pallet.rows
    );

    const palletValidationErrors = pallets.flatMap(
        pallet => getPalletValidationErrors(pallet)
    );

    const canCreateReceipt =
        allRows.length > 0 &&
        allRows.every(isRowReady) &&
        palletValidationErrors.length === 0;

    async function createReceipt() {
        if (!result?.uuid || !canCreateReceipt) return;

        setLoading(true);
        setError(null);
        setConfirmError(null);

        try {
            const request: ConfirmImportReceiptRequest = {
                rows: allRows.map(row => ({
                    rowUuid: row.uuid,
                    palletNumber: row.palletNumber!,
                    filmTypeUuid: row.filmTypeUuid!,
                    palletTypeUuid: row.palletTypeUuid!,
                    thicknessMicron: row.thicknessMicron!,
                    widthMm: row.widthMm!,
                    lengthM: row.lengthM!,
                    rollCount: row.rollCount!,
                    netWeightKg: row.netWeightKg!,
                    grossWeightKg: row.grossWeightKg,
                    batchNumber: row.batchNumber,
                    comment: row.comment,
                })),
            };

            const accessToken = getAccessToken();

            if (!accessToken) {
                setError("Пользователь не авторизован. Войдите в систему.");
                return;
            }

            await confirmImportReceipt(result.uuid, request, accessToken);

            setPallets([]);
            setResult(null);
            setFile(null);
        } catch (e) {
            setConfirmError(
                e instanceof Error
                    ? e.message
                    : "Не удалось создать поступление",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h2>Импорт поступления</h2>

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}
            {confirmError && (
                <div
                    style={{
                        marginTop: 16,
                        padding: 12,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        borderRadius: 8,
                        color: "#b91c1c",
                    }}
                >
                    <strong>Не удалось создать поступление</strong>
                    <p style={{ marginTop: 4 }}>{confirmError}</p>
                </div>
            )}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 16,
                    maxWidth: 900,
                }}
            >
                <label>
                    Поставщик
                    <select
                        value={supplierUuid}
                        onChange={event =>
                            setSupplierUuid(event.target.value)
                        }
                        style={{ width: "100%" }}
                    >
                        <option value="">
                            Выберите поставщика
                        </option>

                        {suppliers.map(supplier => (
                            <option
                                key={supplier.uuid}
                                value={supplier.uuid}
                            >
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Файл упаковочного листа
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={event =>
                            setFile(
                                event.target.files?.[0] ?? null,
                            )
                        }
                    />
                </label>
            </div>

            <div style={{ marginTop: 16 }}>
                <button
                    type="button"
                    onClick={upload}
                    disabled={
                        !file || !supplierUuid || loading
                    }
                >
                    {loading ? "Загрузка…" : "Загрузить файл"}
                </button>
            </div>

            {result && (
                <div
                    style={{
                        marginTop: 24,
                        padding: 16,
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                    }}
                >
                    <h3>Файл загружен</h3>

                    <p>Файл: {result.fileName}</p>
                    <p>Статус: {result.status}</p>
                    <p>
                        Формат:{" "}
                        {result.detectedFormat ?? "не определён"}
                    </p>

                    <button
                        type="button"
                        onClick={parse}
                        disabled={loading}
                    >
                        {loading ? "Разбор…" : "Разобрать файл"}
                    </button>
                </div>
            )}

            {pallets.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h3>Строки импорта</h3>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginBottom: 12,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowPalletTypeForm(true)}
                        >
                            Добавить тип поддона
                        </button>
                    </div>

                    {pallets.map(pallet => (
                        <div
                            key={pallet.palletNumber}
                            style={{
                                marginBottom: 24,
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                overflow: "hidden",
                            }}
                        >
                            {getPalletValidationErrors(pallet).length > 0 && (
                                <div
                                    style={{
                                        padding: 12,
                                        background: "#fef2f2",
                                        borderBottom: "1px solid #fecaca",
                                        color: "#b91c1c",
                                    }}
                                >
                                    <strong>Ошибки паллеты:</strong>

                                    <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                                        {getPalletValidationErrors(pallet).map(
                                            (message, index) => (
                                                <li key={index}>
                                                    {message}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    padding: 12,
                                    background: "#f3f4f6",
                                }}
                            >
                                <strong>
                                    Паллета: {pallet.palletNumber}
                                </strong>

                                <label>
                                    Поддон
                                    <select
                                        value={pallet.palletTypeUuid ?? ""}
                                        onChange={event =>
                                            updatePalletType(
                                                pallet.palletNumber,
                                                event.target.value || null,
                                            )
                                        }
                                        style={{ minWidth: 200 }}
                                    >
                                        <option value="">Не выбран</option>

                                        {palletTypes.map(item => (
                                            <option key={item.uuid} value={item.uuid}>
                                                {item.name}
                                                {item.description
                                                    ? ` — ${item.description}`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <span>
                Рулоны: {pallet.rollCount}
            </span>

                                <span>
                Нетто: {pallet.netWeightKg.toFixed(2)} кг
            </span>

                                <span>
                Брутто: {pallet.grossWeightKg.toFixed(2)} кг
            </span>
                            </div>

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 14,
                                }}
                            >
                                <thead>
                                <tr>
                                    <th style={th}>
                                        Штрихкод рулона
                                    </th>

                                    <th style={th}>
                                        Марка поставщика
                                    </th>

                                    <th style={th}>
                                        Принятая марка
                                    </th>

                                    <th style={th}>
                                        Толщина
                                    </th>

                                    <th style={th}>
                                        Ширина
                                    </th>

                                    <th style={th}>
                                        Длина
                                    </th>

                                    <th style={th}>
                                        Кол-во
                                    </th>

                                    <th style={th}>
                                        Нетто
                                    </th>

                                    <th style={th}>
                                        Брутто
                                    </th>

                                    <th style={th}>
                                        Диаметр намотки
                                    </th>

                                    <th style={th}>
                                        Диаметр шпули
                                    </th>

                                    <th style={th}>
                                        Партия
                                    </th>

                                    <th style={th}>
                                        Комментарий
                                    </th>

                                    <th style={th}>
                                        Статус
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {pallet.rows.map(row => {
                                    const rowValidationErrors =
                                        getRowValidationErrors(row);

                                    const rowReady = isRowReady(row);

                                    return (
                                        <tr
                                            key={row.uuid}
                                            style={{
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                            }}
                                        >

                                            <td style={td}>
                                                {row.barcode ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.supplierFilmName ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.filmBrand ??
                                                    "Не найдено"}
                                            </td>

                                            <td style={td}>
                                                {row.thicknessMicron ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.widthMm ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.lengthM ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.rollCount ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.netWeightKg ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.grossWeightKg ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.windDiameterMm ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.spoolDiameterMm ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.batchNumber ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {row.comment ??
                                                    "—"}
                                            </td>

                                            <td style={td}>
                                                {rowReady ? (
                                                    <span style={{ color: "#15803d" }}>
            Готово
        </span>
                                                ) : (
                                                    <div>
                                                        {rowValidationErrors.length > 0 && (
                                                            <ul
                                                                style={{
                                                                    margin: 0,
                                                                    paddingLeft: 16,
                                                                    color: "#b91c1c",
                                                                }}
                                                            >
                                                                {rowValidationErrors.map(
                                                                    (message, index) => (
                                                                        <li key={index}>
                                                                            {message}
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        )}

                                                        {rowValidationErrors.length === 0 && (
                                                            <span style={{ color: "#b91c1c" }}>
                    {[
                        !row.filmTypeUuid && "марка",
                        !row.palletNumber && "паллета",
                        !row.palletTypeUuid && "поддон",
                        !row.thicknessMicron && "толщина",
                        !row.widthMm && "ширина",
                        !row.lengthM && "длина",
                        !row.rollCount && "количество",
                        !row.netWeightKg && "нетто",
                    ]
                        .filter(Boolean)
                        .join(", ") || "Нет соответствия"}
                </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    <div style={{ marginTop: 16 }}>
                        <button
                            type="button"
                            onClick={createReceipt}
                            disabled={!canCreateReceipt || loading}
                        >
                            {loading ? "Импорт…" : "Импортировать файл"}
                        </button>

                        {allRows.length === 0 && (
                            <p style={{ marginTop: 8, color: "#b91c1c" }}>
                                В файле нет рулонов для импорта.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {showPalletTypeForm && (
                <div
                    className="modal"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: 24,
                            borderRadius: 8,
                            width: 420,
                        }}
                    >
                        <h3>Новый тип поддона</h3>

                        {palletTypeError && (
                            <p style={{ color: "red" }}>
                                {palletTypeError}
                            </p>
                        )}

                        <label>
                            Длина, мм
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={palletTypeLength}
                                onChange={event =>
                                    setPalletTypeLength(
                                        event.target.value,
                                    )
                                }
                            />
                        </label>

                        <label>
                            Ширина, мм
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={palletTypeWidth}
                                onChange={event =>
                                    setPalletTypeWidth(
                                        event.target.value,
                                    )
                                }
                            />
                        </label>

                        <label>
                            Описание
                            <input
                                maxLength={100}
                                value={palletTypeDescription}
                                onChange={event =>
                                    setPalletTypeDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="евро, Gettel"
                            />
                        </label>

                        <label>
                            Порядок
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={palletTypeSortOrder}
                                onChange={event =>
                                    setPalletTypeSortOrder(
                                        event.target.value,
                                    )
                                }
                            />
                        </label>

                        <p>
                            Название:{" "}
                            <strong>
                                {palletTypeLength && palletTypeWidth
                                    ? `${palletTypeLength}x${palletTypeWidth}`
                                    : "—"}
                            </strong>
                        </p>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                marginTop: 16,
                            }}
                        >
                            <button
                                type="button"
                                onClick={createPalletTypeItem}
                                disabled={savingPalletType}
                            >
                                {savingPalletType
                                    ? "Сохранение…"
                                    : "Сохранить"}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPalletTypeForm(false)
                                }
                                disabled={savingPalletType}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const th: React.CSSProperties = {
    padding: 8,
    border: "1px solid #e5e7eb",
    textAlign: "left",
    background: "#f9fafb",
};

const td: React.CSSProperties = {
    padding: 8,
    border: "1px solid #e5e7eb",
};
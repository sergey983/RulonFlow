import { useCallback, useEffect, useState } from "react";
import { createPalletType, getPalletTypes, type PalletType } from "../../api/palletTypes";
import { confirmImportReceipt, type ConfirmImportReceiptRequest } from "../../api/importReceipts";
import { getAccessToken } from "../../api/auth";
import { getSuppliers, type Supplier } from "../../api/suppliers";
import { uploadImportReceipt, parseImportReceipt, getImportReceiptDetails } from "../../api/importReceipts";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Input from "../../ui/Input";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import Table, { TableHeader, TableBody, TableRow, TableCell } from "../../ui/Table";
import Modal from "../../ui/Modal";
import '../SharedPage.css';

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

interface NewPalletTypeForm {
    lengthMm: string;
    widthMm: string;
    description: string;
    sortOrder: string;
}

// ============================================================
// Step indicator component
// ============================================================

interface StepIndicatorProps {
    currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
    const steps = [
        { num: 1, label: "Загрузка файла" },
        { num: 2, label: "Разбор данных" },
        { num: 3, label: "Проверка и импорт" },
    ];

    return (
        <div className="steps">
            {steps.map((step, i) => (
                <div key={step.num}>
                    {i > 0 && (
                        <div className="step__connector" style={{
                            background: step.num <= currentStep ? "var(--step-complete)" : "var(--step-inactive)"
                        }} />
                    )}
                    <div className={`step ${step.num === currentStep ? "step--active" : step.num < currentStep ? "step--complete" : ""}`}>
                        <div className="step__circle">
                            {step.num < currentStep ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                step.num
                            )}
                        </div>
                        <span className="step__label">{step.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// TechnologistImportPage
// ============================================================

export default function TechnologistImportPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierUuid, setSupplierUuid] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<ImportFileResult | null>(null);
    const [pallets, setPallets] = useState<ImportPallet[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
    const [confirmError, setConfirmError] = useState<string | null>(null);

    // Pallet type modal
    const [showPalletTypeModal, setShowPalletTypeModal] = useState(false);
    const [palletTypeForm, setPalletTypeForm] = useState<NewPalletTypeForm>({
        lengthMm: "",
        widthMm: "",
        description: "",
        sortOrder: "0",
    });
    const [palletTypeError, setPalletTypeError] = useState<string | null>(null);
    const [savingPalletType, setSavingPalletType] = useState(false);

    const loadDictionaries = useCallback(async () => {
        try {
            const [suppliersRes, palletTypesData] = await Promise.all([
                getSuppliers(),
                getPalletTypes(1, 200),
            ]);
            setSuppliers(suppliersRes.items);
            setPalletTypes(palletTypesData.items);
        } catch {
            setError("Не удалось загрузить справочники");
        }
    }, []);

    useEffect(() => {
        void loadDictionaries();
    }, [loadDictionaries]);

    // --- File upload ---
    async function upload() {
        if (!file || !supplierUuid) return;

        setLoading(true);
        setError(null);

        try {
            const uploaded = await uploadImportReceipt(file, supplierUuid);
            setResult(uploaded);
            setPallets([]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Не удалось загрузить файл");
        } finally {
            setLoading(false);
        }
    }

    // --- Parse ---
    async function parse() {
        if (!result?.uuid) return;

        setLoading(true);
        setError(null);

        try {
            await parseImportReceipt(result.uuid);

            const details = await getImportReceiptDetails(result.uuid);

            const normalizedPallets = details.pallets.map((pallet) => ({
                ...pallet,
                rows: pallet.rows.map((row) => ({
                    ...row,
                    palletTypeUuid: row.palletTypeUuid ?? pallet.palletTypeUuid ?? null,
                })),
            }));

            setPallets(normalizedPallets);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Не удалось разобрать файл");
        } finally {
            setLoading(false);
        }
    }

    // --- Update pallet type for a pallet ---
    function updatePalletType(palletNumber: string, palletTypeUuid: string | null) {
        setPallets((prev) =>
            prev.map((pallet) =>
                pallet.palletNumber === palletNumber
                    ? ({
                        ...pallet,
                        palletTypeUuid,
                        rows: pallet.rows.map((row) => ({ ...row, palletTypeUuid })),
                    })
                    : pallet
            )
        );
    }

    // --- Create new pallet type ---
    async function createPalletTypeItem() {
        const lengthMm = Number(palletTypeForm.lengthMm);
        const widthMm = Number(palletTypeForm.widthMm);
        const sortOrder = Number(palletTypeForm.sortOrder || 0);

        if (!Number.isInteger(lengthMm) || lengthMm <= 0) {
            setPalletTypeError("Укажите целую длину поддона больше нуля");
            return;
        }
        if (!Number.isInteger(widthMm) || widthMm <= 0) {
            setPalletTypeError("Укажите целую ширину поддона больше нуля");
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
                description: palletTypeForm.description.trim() || null,
                sortOrder,
            });

            setPalletTypes((prev) => [...prev, created]);
            setShowPalletTypeModal(false);
            setPalletTypeForm({ lengthMm: "", widthMm: "", description: "", sortOrder: "0" });
        } catch (e) {
            setPalletTypeError(e instanceof Error ? e.message : "Не удалось создать тип поддона");
        } finally {
            setSavingPalletType(false);
        }
    }

    // --- Validation ---
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
            row.netWeightKg > 0
        );
    }

    function getRowValidationErrors(row: ImportRow): string[] {
        if (!row.validationErrors) return [];
        return row.validationErrors
            .split(";")
            .map((m) => m.trim())
            .filter(Boolean);
    }

    function isRowReady(row: ImportRow): boolean {
        return canAddRow(row) && row.isValid !== false && getRowValidationErrors(row).length === 0;
    }

    function getPalletValidationErrors(pallet: ImportPallet): string[] {
        return pallet.validationErrors ?? [];
    }

    const allRows = pallets.flatMap((p) => p.rows);
    const palletValidationErrors = pallets.flatMap((p) => getPalletValidationErrors(p));

    const canCreateReceipt =
        allRows.length > 0 &&
        allRows.every(isRowReady) &&
        palletValidationErrors.length === 0;

    // --- Confirm import ---
    async function createReceipt() {
        if (!result?.uuid || !canCreateReceipt) return;

        setLoading(true);
        setError(null);
        setConfirmError(null);

        try {
            const request: ConfirmImportReceiptRequest = {
                rows: allRows.map((row) => ({
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
            setConfirmError(e instanceof Error ? e.message : "Не удалось создать поступление");
        } finally {
            setLoading(false);
        }
    }

    // --- Reset state ---
    function resetState() {
        setResult(null);
        setPallets([]);
        setFile(null);
        setConfirmError(null);
        setError(null);
    }

    // --- Supplier options ---
    const supplierOptions = suppliers.map((s) => ({ value: s.uuid, label: s.name }));

    // --- Current step ---
    const currentStep = pallets.length > 0 ? 3 : result ? 2 : 1;

    // --- Stats ---
    const totalRolls = pallets.reduce((sum, p) => sum + p.rollCount, 0);
    const totalWeight = pallets.reduce((sum, p) => sum + p.grossWeightKg, 0);

    return (
        <div className="entity-page">
            {/* Step indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* ---- Error ---- */}
            {error && (
                <div className="alert alert--danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>{error}</span>
                    <button className="btn btn--ghost btn--sm" onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* Step 1: Upload */}
            {!result && (
                <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12, background: "var(--accent-bg)",
                            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ marginTop: 0, marginBottom: 2 }}>Загрузка упаковочного листа</h2>
                            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>Шаг 1 из 3 — выберите поставщика и загрузите файл</p>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
                        <Select
                            label="Поставщик"
                            options={supplierOptions}
                            placeholder="Выберите поставщика"
                            value={supplierUuid}
                            onChange={(e) => setSupplierUuid(e.target.value)}
                            required
                        />

                        <div className="input-wrapper">
                            <label className="input-label">Файл упаковочного листа</label>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                style={{
                                    padding: "10px 14px",
                                    border: "1.5px dashed var(--border)",
                                    borderRadius: 10,
                                    fontSize: 14,
                                    background: "var(--field-bg)",
                                    cursor: "pointer",
                                    transition: "all var(--transition-base)",
                                }}
                            />
                        </div>

                        <Button
                            variant="primary"
                            onClick={upload}
                            disabled={!file || !supplierUuid || loading}
                            leftIcon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                            }
                        >
                            {loading ? "Загрузка…" : "Загрузить файл"}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Step 2: File uploaded, need to parse */}
            {result && !pallets.length && !loading && (
                <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12, background: "var(--warning-bg)",
                            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--warning)", flexShrink: 0
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ marginTop: 0, marginBottom: 2 }}>Файл загружен</h2>
                            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>Шаг 2 из 3 — разберите файл для проверки данных</p>
                        </div>
                    </div>

                    <div className="form-section" style={{ marginBottom: 20, padding: 16 }}>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Файл</div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{result.fileName}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Статус</div>
                                <Badge variant={result.status === "completed" ? "success" : "warning"}>{result.status}</Badge>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Формат</div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{result.detectedFormat ?? "не определён"}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                        <Button variant="primary" onClick={parse} disabled={loading}
                            leftIcon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                </svg>
                            }
                        >
                            {loading ? "Разбор…" : "Разобрать файл"}
                        </Button>
                        <Button variant="secondary" onClick={resetState}>
                            Загрузить другой
                        </Button>
                    </div>
                </Card>
            )}

            {/* Step 3: Pallets ready */}
            {pallets.length > 0 && (
                <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                            <h2 style={{ marginTop: 0, marginBottom: 4 }}>Проверка данных</h2>
                            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
                                Шаг 3 из 3 — {pallets.length} паллет, {totalRolls} рулонов, {totalWeight.toFixed(1)} кг
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Button variant="ghost" size="sm" onClick={() => setShowPalletTypeModal(true)}
                                leftIcon={
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                }
                            >
                                + Тип поддона
                            </Button>
                            <Button variant="ghost" size="sm" onClick={resetState} title="Загрузить другой файл">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                            </Button>
                        </div>
                    </div>

                    {/* Global status bar */}
                    <div style={{
                        display: "flex", gap: 12, marginBottom: 20, padding: "12px 16px",
                        background: canCreateReceipt ? "var(--success-bg)" : "var(--warning-bg)",
                        borderRadius: 10, border: `1px solid ${canCreateReceipt ? "var(--success-border)" : "var(--warning-border)"}`
                    }}>
                        {canCreateReceipt ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        )}
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: canCreateReceipt ? "var(--success)" : "var(--warning)" }}>
                                {canCreateReceipt ? "Все данные корректны, можно импортировать" : "Есть ошибки, требующие исправления"}
                            </div>
                            {palletValidationErrors.length > 0 && (
                                <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 2 }}>
                                    ⚠ {palletValidationErrors.length} ошибок паллет
                                </div>
                            )}
                        </div>
                    </div>

                    {pallets.map((pallet) => (
                        <div key={pallet.palletNumber} style={{ marginBottom: 24 }}>
                            {/* Pallet errors */}
                            {getPalletValidationErrors(pallet).length > 0 && (
                                <div className="alert alert--danger" style={{ marginBottom: 8 }}>
                                    <strong>Ошибки паллеты {pallet.palletNumber}:</strong>
                                    <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                                        {getPalletValidationErrors(pallet).map((msg, i) => (
                                            <li key={i}>{msg}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Pallet header */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                padding: "12px 16px",
                                background: "var(--section-bg)",
                                border: "1px solid var(--divider)",
                                borderRadius: 10,
                                marginBottom: 8,
                                flexWrap: "wrap",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8, background: "var(--accent)",
                                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 12, fontWeight: 700, flexShrink: 0
                                    }}>
                                        {pallet.palletNumber}
                                    </div>
                                    <strong style={{ fontSize: 14 }}>Паллета</strong>
                                </div>

                                <Select
                                    options={palletTypes.map((p) => ({ value: p.uuid, label: `${p.name}${p.description ? ` — ${p.description}` : ""}` }))}
                                    value={pallet.palletTypeUuid ?? ""}
                                    onChange={(e) => updatePalletType(pallet.palletNumber, e.target.value || null)}
                                    style={{ minWidth: 200, flex: 1 }}
                                />

                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    <Badge variant="default">📦 {pallet.rollCount} рул.</Badge>
                                    <Badge variant="info">⚖ {pallet.netWeightKg.toFixed(1)} кг</Badge>
                                    <Badge variant="info">📐 {pallet.grossWeightKg.toFixed(1)} кг</Badge>
                                </div>
                            </div>

                            {/* Rows table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableCell th>Штрихкод</TableCell>
                                        <TableCell th>Марка</TableCell>
                                        <TableCell th>Толщ.</TableCell>
                                        <TableCell th>Ширина</TableCell>
                                        <TableCell th>Длина</TableCell>
                                        <TableCell th>Кол-во</TableCell>
                                        <TableCell th>Нетто</TableCell>
                                        <TableCell th>Брутто</TableCell>
                                        <TableCell th>Партия</TableCell>
                                        <TableCell th>Комментарий</TableCell>
                                        <TableCell th>Статус</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pallet.rows.map((row) => {
                                        const rowValidationErrors = getRowValidationErrors(row);
                                        const rowReady = isRowReady(row);

                                        return (
                                            <TableRow key={row.uuid}>
                                                <TableCell><code>{row.barcode ?? "—"}</code></TableCell>
                                                <TableCell>{row.supplierFilmName ?? row.filmBrand ?? "—"}</TableCell>
                                                <TableCell>{row.thicknessMicron ?? "—"}</TableCell>
                                                <TableCell>{row.widthMm ?? "—"}</TableCell>
                                                <TableCell>{row.lengthM ?? "—"}</TableCell>
                                                <TableCell>{row.rollCount ?? "—"}</TableCell>
                                                <TableCell>{row.netWeightKg?.toFixed(2) ?? "—"}</TableCell>
                                                <TableCell>{row.grossWeightKg?.toFixed(2) ?? "—"}</TableCell>
                                                <TableCell>{row.batchNumber ?? "—"}</TableCell>
                                                <TableCell className="text-muted text-sm">{row.comment ?? "—"}</TableCell>
                                                <TableCell>
                                                    {rowReady ? (
                                                        <Badge variant="success">✓</Badge>
                                                    ) : (
                                                        <div>
                                                            {rowValidationErrors.length > 0 ? (
                                                                <ul style={{ margin: 0, paddingLeft: 16, color: "var(--danger)", fontSize: 11, lineHeight: 1.4 }}>
                                                                    {rowValidationErrors.map((msg, i) => (
                                                                        <li key={i}>{msg}</li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                                                                    Не заполнено
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ))}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--divider)", flexWrap: "wrap", alignItems: "center" }}>
                        <Button
                            variant="primary"
                            onClick={createReceipt}
                            disabled={!canCreateReceipt || loading}
                            leftIcon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                            }
                        >
                            {loading ? "Импорт…" : "Импортировать в поступление"}
                        </Button>
                        <Button variant="ghost" onClick={resetState}>
                            Отменить
                        </Button>
                        {allRows.length === 0 && (
                            <span style={{ color: "var(--danger)", fontSize: 14 }}>
                                В файле нет рулонов для импорта.
                            </span>
                        )}
                    </div>
                </Card>
            )}

            {/* Confirmation errors */}
            {confirmError && (
                <div className="alert alert--danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>Не удалось создать поступление: {confirmError}</span>
                    <button className="btn btn--ghost btn--sm" onClick={() => setConfirmError(null)}>✕</button>
                </div>
            )}

            {/* --- New pallet type modal --- */}
            <Modal
                isOpen={showPalletTypeModal}
                onClose={() => setShowPalletTypeModal(false)}
                title="📐 Новый тип поддона"
                actions={
                    <>
                        <Button variant="primary" onClick={createPalletTypeItem} disabled={savingPalletType}>
                            {savingPalletType ? "Сохранение…" : "Сохранить"}
                        </Button>
                        <Button variant="secondary" onClick={() => setShowPalletTypeModal(false)} disabled={savingPalletType}>
                            Отмена
                        </Button>
                    </>
                }
            >
                {palletTypeError && (
                    <div className="alert alert--danger" style={{ marginBottom: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        <span>{palletTypeError}</span>
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <Input
                        label="Длина, мм *"
                        type="number"
                        min="1"
                        step="1"
                        value={palletTypeForm.lengthMm}
                        onChange={(e) => setPalletTypeForm({ ...palletTypeForm, lengthMm: e.target.value })}
                    />
                    <Input
                        label="Ширина, мм *"
                        type="number"
                        min="1"
                        step="1"
                        value={palletTypeForm.widthMm}
                        onChange={(e) => setPalletTypeForm({ ...palletTypeForm, widthMm: e.target.value })}
                    />
                    <Input
                        label="Описание"
                        placeholder="евро, Gettel"
                        value={palletTypeForm.description}
                        onChange={(e) => setPalletTypeForm({ ...palletTypeForm, description: e.target.value })}
                    />
                    <Input
                        label="Порядок"
                        type="number"
                        min="0"
                        step="1"
                        value={palletTypeForm.sortOrder}
                        onChange={(e) => setPalletTypeForm({ ...palletTypeForm, sortOrder: e.target.value })}
                        helpText="Порядок отображения в списке"
                    />

                    <div style={{
                        padding: 12, background: "var(--section-bg)", borderRadius: 10,
                        fontSize: 14, color: "var(--text-muted)"
                    }}>
                        Название: <strong style={{ color: "var(--text-h)" }}>
                            {palletTypeForm.lengthMm && palletTypeForm.widthMm
                                ? `${palletTypeForm.lengthMm}x${palletTypeForm.widthMm}`
                                : "—"}
                        </strong>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

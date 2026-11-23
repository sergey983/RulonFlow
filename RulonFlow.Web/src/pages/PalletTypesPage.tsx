import { useCallback, useEffect, useState } from "react";
import {
    createPalletType,
    getPalletTypes,
    updatePalletType,
} from "../api/palletTypes";
import type { PalletType } from "../api/palletTypes";

interface PalletTypeFormState {
    lengthMm: string;
    widthMm: string;
    description: string;
    sortOrder: string;
}

const emptyForm: PalletTypeFormState = {
    lengthMm: "",
    widthMm: "",
    description: "",
    sortOrder: "0",
};

export default function PalletTypesPage() {
    const [items, setItems] = useState<PalletType[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [editing, setEditing] = useState<PalletType | null>(null);
    const [form, setForm] = useState<PalletTypeFormState>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const result = await getPalletTypes(1, 200);

            setItems(result.items);
        } catch (e) {
            setLoadError(
                e instanceof Error
                    ? e.message
                    : "Не удалось загрузить справочник",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void load();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [load]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormError(null);
        setShowForm(true);
    };

    const openEdit = (item: PalletType) => {
        setEditing(item);
        setForm({
            lengthMm: item.lengthMm.toString(),
            widthMm: item.widthMm.toString(),
            description: item.description ?? "",
            sortOrder: item.sortOrder.toString(),
        });
        setFormError(null);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setFormError(null);
    };

    const save = async () => {
        const lengthMm = Number(form.lengthMm);
        const widthMm = Number(form.widthMm);
        const sortOrder = Number(form.sortOrder || 0);

        if (!Number.isInteger(lengthMm) || lengthMm <= 0) {
            setFormError("Укажите целую длину поддона больше нуля");
            return;
        }

        if (!Number.isInteger(widthMm) || widthMm <= 0) {
            setFormError("Укажите целую ширину поддона больше нуля");
            return;
        }

        if (!Number.isInteger(sortOrder) || sortOrder < 0) {
            setFormError("Укажите целое значение порядка");
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            const payload = {
                name: `${lengthMm}x${widthMm}`,
                lengthMm,
                widthMm,
                description: form.description.trim() || null,
                sortOrder,
            };

            if (editing) {
                await updatePalletType(editing.uuid, payload);
            } else {
                await createPalletType(payload);
            }

            closeForm();
            await load();
        } catch (e) {
            setFormError(
                e instanceof Error
                    ? e.message
                    : "Не удалось сохранить тип паллеты",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                <h2 style={{ margin: 0 }}>Типы паллет</h2>

                <button type="button" onClick={openCreate}>
                    Добавить
                </button>
            </div>

            {loading && <p>Загрузка…</p>}

            {loadError && (
                <p style={{ color: "red" }}>
                    {loadError}{" "}
                    <button type="button" onClick={() => void load()}>
                        Повторить
                    </button>
                </p>
            )}

            {!loading && !loadError && (
                <table>
                    <thead>
                    <tr>
                        <th>Порядок</th>
                        <th>Название</th>
                        <th>Длина, мм</th>
                        <th>Ширина, мм</th>
                        <th>Описание</th>
                        <th />
                    </tr>
                    </thead>

                    <tbody>
                    {items.map(item => (
                        <tr key={item.uuid}>
                            <td>{item.sortOrder}</td>
                            <td>{item.name}</td>
                            <td>{item.lengthMm}</td>
                            <td>{item.widthMm}</td>
                            <td>{item.description ?? "—"}</td>
                            <td>
                                <button
                                    type="button"
                                    onClick={() => openEdit(item)}
                                >
                                    Изменить
                                </button>
                            </td>
                        </tr>
                    ))}

                    {!loading && items.length === 0 && (
                        <tr>
                            <td colSpan={6}>Записи не найдены</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            )}

            {showForm && (
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
                        <h3>
                            {editing
                                ? "Изменить тип паллеты"
                                : "Новый тип паллеты"}
                        </h3>

                        {formError && (
                            <p style={{ color: "red" }}>{formError}</p>
                        )}

                        <label>
                            Длина, мм
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={form.lengthMm}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        lengthMm: event.target.value,
                                    })
                                }
                            />
                        </label>

                        <label>
                            Ширина, мм
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={form.widthMm}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        widthMm: event.target.value,
                                    })
                                }
                            />
                        </label>

                        <label>
                            Описание
                            <input
                                value={form.description}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        description:
                                        event.target.value,
                                    })
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
                                value={form.sortOrder}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        sortOrder:
                                        event.target.value,
                                    })
                                }
                            />
                        </label>

                        <p>
                            Название:{" "}
                            <strong>
                                {form.lengthMm && form.widthMm
                                    ? `${form.lengthMm}x${form.widthMm}`
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
                                onClick={save}
                                disabled={saving}
                            >
                                {saving ? "Сохранение…" : "Сохранить"}
                            </button>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
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
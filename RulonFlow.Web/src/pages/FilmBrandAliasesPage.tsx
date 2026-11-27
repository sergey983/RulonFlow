import { useEffect, useState } from "react";
import { api } from "../api/client";
import {
    getFilmBrandAliases,
    createFilmBrandAlias,
    deleteFilmBrandAlias,
    type FilmBrandAlias,
    type FilmBrandAliasFormValues
} from "../api/filmBrandAliases";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Table, { TableHeader, TableBody, TableRow, TableCell } from "../ui/Table";
import './SharedPage.css';

type Supplier = { uuid: string; name: string };
type FilmType = { uuid: string; brand: string };

export default function FilmBrandAliasesPage() {
    const [items, setItems] = useState<FilmBrandAlias[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [filmTypes, setFilmTypes] = useState<FilmType[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FilmBrandAliasFormValues>({
        supplierUuid: "",
        supplierFilmName: "",
        filmTypeUuid: "",
        isActive: true
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [aliases, suppliersResp, filmTypesResp] = await Promise.all([
                getFilmBrandAliases(),
                api.get("/suppliers", { params: { pageSize: 200 } }),
                api.get("/film-types", { params: { pageSize: 200 } })
            ]);

            setItems(aliases);
            setSuppliers(suppliersResp.data.items);
            setFilmTypes(filmTypesResp.data.items);
        } catch (e: any) {
            const msg = e?.response?.data?.error?.message 
                || e?.response?.data?.error 
                || e?.response?.data?.message 
                || e?.message 
                || "Не удалось загрузить данные справочников";
            console.error("Load error:", e);
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function openCreate() {
        setForm({
            supplierUuid: "",
            supplierFilmName: "",
            filmTypeUuid: "",
            isActive: true
        });
        setFormError(null);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setFormError(null);
    }

    async function submit() {
        if (!form.supplierUuid) {
            setFormError("Выберите поставщика.");
            return;
        }
        if (!form.supplierFilmName.trim()) {
            setFormError("Укажите название у поставщика.");
            return;
        }
        if (!form.filmTypeUuid) {
            setFormError("Выберите нашу марку.");
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            await createFilmBrandAlias(form);
            closeForm();
            await load();
        } catch {
            setFormError("Не удалось создать соответствие");
        } finally {
            setSaving(false);
        }
    }

    async function remove(uuid: string) {
        if (!window.confirm("Удалить это соответствие?")) return;

        try {
            await deleteFilmBrandAlias(uuid);
            await load();
        } catch {
            setError("Не удалось удалить соответствие");
        }
    }

    const supplierOptions = suppliers.map(s => ({
        value: s.uuid,
        label: s.name
    }));

    const filmTypeOptions = filmTypes.map(f => ({
        value: f.uuid,
        label: f.brand
    }));

    return (
        <div className="entity-page">
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Соответствия марок</h1>
                </div>
                <Button variant="primary" onClick={openCreate}>
                    + Добавить
                </Button>
            </div>

            {loadError && (
                <div className="alert alert--danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{loadError}</span>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell th>Поставщик</TableCell>
                        <TableCell th>Название у поставщика</TableCell>
                        <TableCell th>Наша марка</TableCell>
                        <TableCell th>Статус</TableCell>
                        <TableCell th className="table__cell--actions">Действия</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell th={false} colSpan={5} className="text-center">Загрузка…</TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {items.map(item => (
                                <TableRow key={item.uuid}>
                                    <TableCell>{item.supplierName}</TableCell>
                                    <TableCell><strong>{item.supplierFilmName}</strong></TableCell>
                                    <TableCell><Badge variant="info">{item.filmBrand}</Badge></TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? 'success' : 'default'}>
                                            {item.isActive ? 'Активно' : 'Неактивно'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="table__cell--actions">
                                        <Button variant="ghost" size="sm" onClick={() => remove(item.uuid)} className="btn--danger">
                                            Удалить
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell th={false} colSpan={5} className="text-center">
                                        <div className="empty-state">
                                            <div className="empty-state__icon">🔄</div>
                                            <div className="empty-state__title">Нет данных</div>
                                            <div className="empty-state__description">Добавьте первое соответствие</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    )}
                </TableBody>
            </Table>

            <Modal
                isOpen={showForm}
                onClose={closeForm}
                title="Новое соответствие"
                actions={
                    <>
                        <Button variant="primary" onClick={submit} disabled={saving}>
                            {saving ? 'Сохранение…' : 'Добавить'}
                        </Button>
                        <Button variant="secondary" onClick={closeForm} disabled={saving}>
                            Отмена
                        </Button>
                    </>
                }
            >
                {formError && (
                    <div className="alert alert--danger" style={{ marginBottom: 0 }}>
                        <span>{formError}</span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Select
                        label="Поставщик"
                        options={supplierOptions}
                        placeholder="Выберите поставщика"
                        value={form.supplierUuid}
                        onChange={e => setForm({ ...form, supplierUuid: e.target.value })}
                        required
                    />
                    <Input
                        label="Название у поставщика"
                        placeholder="Например: Плёнка ХХ-100"
                        value={form.supplierFilmName}
                        onChange={e => setForm({ ...form, supplierFilmName: e.target.value })}
                        required
                    />
                    <Select
                        label="Наша марка"
                        options={filmTypeOptions}
                        placeholder="Выберите марку"
                        value={form.filmTypeUuid}
                        onChange={e => setForm({ ...form, filmTypeUuid: e.target.value })}
                        required
                    />

                    <label className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        />
                        <span>Активно</span>
                    </label>
                </div>
            </Modal>
        </div>
    );
}

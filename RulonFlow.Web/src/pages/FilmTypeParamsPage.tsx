import { useCallback, useEffect, useState } from 'react';
import { getFilmTypeParams, createFilmTypeParam, updateFilmTypeParam, type FilmTypeParam } from '../api/filmTypeParams';
import { getFilmTypes, type FilmType } from '../api/filmTypes';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import './SharedPage.css';

interface ParamFormState {
    filmTypeUuid: string;
    thicknessMicron: number;
    surface: string;
    price: string;
    currencyCode: string;
    isActive: boolean;
}

const emptyForm: ParamFormState = {
    filmTypeUuid: '',
    thicknessMicron: 0,
    surface: '',
    price: '',
    currencyCode: 'RUB',
    isActive: true
};

export default function FilmTypeParamsPage() {
    const [items, setItems] = useState<FilmTypeParam[]>([]);
    const [filmTypes, setFilmTypes] = useState<FilmType[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<FilmTypeParam | null>(null);
    const [form, setForm] = useState<ParamFormState>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const [result, types] = await Promise.all([
                getFilmTypeParams(1, 500),
                getFilmTypes()
            ]);
            setItems(result.items);
            setFilmTypes(types.items);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить параметры');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormError(null);
        setShowForm(true);
    };

    const openEdit = (item: FilmTypeParam) => {
        setEditing(item);
        setForm({
            filmTypeUuid: item.filmTypeUuid,
            thicknessMicron: item.thicknessMicron,
            surface: item.surface?.toString() ?? '',
            price: item.price?.toString() ?? '',
            currencyCode: item.currencyCode,
            isActive: item.isActive
        });
        setFormError(null);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setFormError(null);
    };

    const save = async () => {
        if (!form.filmTypeUuid) {
            setFormError('Выберите марку плёнки.');
            return;
        }
        if (!form.thicknessMicron || form.thicknessMicron <= 0) {
            setFormError('Укажите толщину больше нуля.');
            return;
        }

        setSaving(true);
        setFormError(null);

        const payload = {
            filmTypeUuid: form.filmTypeUuid,
            thicknessMicron: form.thicknessMicron,
            surface: form.surface ? Number(form.surface) : null,
            price: form.price ? Number(form.price) : null,
            currencyCode: form.currencyCode || 'RUB',
            isActive: form.isActive
        };

        try {
            if (editing) {
                await updateFilmTypeParam(editing.uuid, payload);
            } else {
                await createFilmTypeParam(payload);
            }
            closeForm();
            await load();
        } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Не удалось сохранить параметр');
        } finally {
            setSaving(false);
        }
    };

    const brandOptions = filmTypes.map(ft => ({
        value: ft.uuid,
        label: ft.brand
    }));

    return (
        <div className="entity-page">
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Параметры плёнки</h1>
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
                    <span>{loadError} <a onClick={() => void load()} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Повторить</a></span>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell th>Марка</TableCell>
                        <TableCell th>Толщина, мкм</TableCell>
                        <TableCell th>Поверхность, м²/кг</TableCell>
                        <TableCell th>Цена</TableCell>
                        <TableCell th>Статус</TableCell>
                        <TableCell th className="table__cell--actions">Действия</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell th={false} colSpan={6} className="text-center">Загрузка…</TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {items.map(item => (
                                <TableRow key={item.uuid}>
                                    <TableCell><Badge variant="info">{item.filmBrand}</Badge></TableCell>
                                    <TableCell><code>{item.thicknessMicron}</code></TableCell>
                                    <TableCell>{item.surface ?? '—'}</TableCell>
                                    <TableCell>{item.price ? `${item.price} ${item.currencyCode}` : '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? 'success' : 'default'}>
                                            {item.isActive ? 'Активен' : 'Неактивен'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="table__cell--actions">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                                            Изменить
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && items.length === 0 && (
                                <TableRow>
                                    <TableCell th={false} colSpan={6} className="text-center">
                                        <div className="empty-state">
                                            <div className="empty-state__icon">📊</div>
                                            <div className="empty-state__title">Нет данных</div>
                                            <div className="empty-state__description">Добавьте первый параметр плёнки</div>
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
                title={editing ? 'Редактировать параметр' : 'Новый параметр'}
                actions={
                    <>
                        <Button variant="primary" onClick={save} disabled={saving}>
                            {saving ? 'Сохранение…' : editing ? 'Сохранить' : 'Добавить'}
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
                        label="Марка плёнки"
                        options={brandOptions}
                        placeholder="Выберите марку"
                        value={form.filmTypeUuid}
                        onChange={e => setForm({ ...form, filmTypeUuid: e.target.value })}
                        required
                    />
                    <Input
                        label="Толщина, мкм"
                        type="number"
                        placeholder="12"
                        value={form.thicknessMicron || ''}
                        onChange={e => setForm({ ...form, thicknessMicron: Number(e.target.value) })}
                    />
                    <Input
                        label="Поверхность, м²/кг"
                        type="number"
                        step="0.01"
                        placeholder="1.5"
                        value={form.surface}
                        onChange={e => setForm({ ...form, surface: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: 16 }}>
                        <Input
                            label="Цена"
                            type="number"
                            step="0.01"
                            placeholder="150.00"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                            style={{ flex: 1 }}
                        />
                        <Input
                            label="Валюта"
                            placeholder="RUB"
                            value={form.currencyCode}
                            onChange={e => setForm({ ...form, currencyCode: e.target.value })}
                            style={{ width: 100 }}
                        />
                    </div>

                    <label className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        />
                        <span>Активен</span>
                    </label>
                </div>
            </Modal>
        </div>
    );
}

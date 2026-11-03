import { useEffect, useState } from 'react';
import {
    getFilmTypes,
    createFilmType,
    updateFilmType,
    getFilmTypeParams,
    createFilmTypeParam,
    updateFilmTypeParam,
    type FilmType,
    type FilmTypeParam
} from '../api/filmTypes';

const emptyFilmType = {
    brand: '',
    displayName: '',
    densityGcm3: '',
    description: '',
    isActive: true
};

const emptyParam = {
    thicknessMicron: 0,
    surface: '',
    price: '',
    currencyCode: 'RUB',
    isActive: true
};

export default function FilmTypesPage() {
    const [filmTypes, setFilmTypes] = useState<FilmType[]>([]);
    const [selectedFilmType, setSelectedFilmType] = useState<FilmType | null>(null);
    const [params, setParams] = useState<FilmTypeParam[]>([]);

    const [filmTypeForm, setFilmTypeForm] = useState(emptyFilmType);
    const [editingFilmTypeUuid, setEditingFilmTypeUuid] = useState<string | null>(null);

    const [paramForm, setParamForm] = useState(emptyParam);
    const [editingParamUuid, setEditingParamUuid] = useState<string | null>(null);

    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const result = await getFilmTypes();

                if (!cancelled) {
                    setFilmTypes(result.items);
                    setError('');
                }
            } catch {
                if (!cancelled) {
                    setError('Не удалось загрузить марки плёнки.');
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    function handleSelectFilmType(filmType: FilmType) {
        setSelectedFilmType(filmType);
        setParams([]);
        setEditingParamUuid(null);
        setParamForm(emptyParam);

        void loadParams(filmType);
    }
    async function reloadFilmTypes() {
        try {
            const result = await getFilmTypes();
            setFilmTypes(result.items);
            setError('');
        } catch {
            setError('Не удалось загрузить марки плёнки.');
        }
    }
    async function loadParams(filmType: FilmType) {
        try {
            const result = await getFilmTypeParams(filmType.uuid);
            setParams(result.items);
            setError('');
        } catch {
            setError('Не удалось загрузить параметры марки.');
        }
    }

    function startEditFilmType(filmType: FilmType) {
        setSelectedFilmType(null);
        setParams([]);
        setEditingParamUuid(null);
        setParamForm(emptyParam);

        setEditingFilmTypeUuid(filmType.uuid);
        setFilmTypeForm({
            brand: filmType.brand,
            displayName: filmType.displayName,
            densityGcm3: filmType.densityGcm3?.toString() ?? '',
            description: filmType.description ?? '',
            isActive: filmType.isActive
        });
    }

    async function saveFilmType() {
        if (!filmTypeForm.brand.trim()) {
            setError('Укажите марку.');
            return;
        }

        const payload = {
            brand: filmTypeForm.brand.trim(),
            displayName: filmTypeForm.displayName.trim() || filmTypeForm.brand.trim(),
            densityGcm3: filmTypeForm.densityGcm3
                ? Number(filmTypeForm.densityGcm3)
                : null,
            description: filmTypeForm.description.trim() || null,
            isActive: filmTypeForm.isActive
        };

        try {
            if (editingFilmTypeUuid) {
                await updateFilmType(editingFilmTypeUuid, payload);
            } else {
                await createFilmType(payload);
            }

            setEditingFilmTypeUuid(null);
            setFilmTypeForm(emptyFilmType);
            await reloadFilmTypes();
        } catch {
            setError('Не удалось сохранить марку.');
        }
    }


    function startEditParam(param: FilmTypeParam) {
        setEditingParamUuid(param.uuid);
        setParamForm({
            thicknessMicron: param.thicknessMicron,
            surface: param.surface?.toString() ?? '',
            price: param.price?.toString() ?? '',
            currencyCode: param.currencyCode,
            isActive: param.isActive
        });
    }

    async function saveParam() {
        if (!selectedFilmType) return;

        if (!paramForm.thicknessMicron || paramForm.thicknessMicron <= 0) {
            setError('Укажите толщину больше нуля.');
            return;
        }

        const payload = {
            thicknessMicron: Number(paramForm.thicknessMicron),
            surface: paramForm.surface ? Number(paramForm.surface) : null,
            price: paramForm.price ? Number(paramForm.price) : null,
            currencyCode: paramForm.currencyCode || 'RUB',
            isActive: paramForm.isActive
        };

        try {
            if (editingParamUuid) {
                await updateFilmTypeParam(
                    selectedFilmType.uuid,
                    editingParamUuid,
                    payload
                );
            } else {
                await createFilmTypeParam(selectedFilmType.uuid, payload);
            }

            setEditingParamUuid(null);
            setParamForm(emptyParam);
            await loadParams(selectedFilmType);
        } catch {
            setError('Не удалось сохранить параметр марки.');
        }
    }

    return (
        <div>
            <h1>Марки плёнки</h1>

            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

            <section className="card" style={{ marginBottom: 24 }}>
                <h2>
                    {editingFilmTypeUuid ? 'Редактирование марки' : 'Новая марка'}
                </h2>

                <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
                    <input
                        placeholder="Марка, например HGPL"
                        value={filmTypeForm.brand}
                        onChange={e =>
                            setFilmTypeForm({
                                ...filmTypeForm,
                                brand: e.target.value
                            })
                        }
                    />

                    <input
                        placeholder="Отображаемое название"
                        value={filmTypeForm.displayName}
                        onChange={e =>
                            setFilmTypeForm({
                                ...filmTypeForm,
                                displayName: e.target.value
                            })
                        }
                    />

                    <input
                        type="number"
                        step="0.001"
                        placeholder="Плотность, г/см³"
                        value={filmTypeForm.densityGcm3}
                        onChange={e =>
                            setFilmTypeForm({
                                ...filmTypeForm,
                                densityGcm3: e.target.value
                            })
                        }
                    />

                    <input
                        placeholder="Описание"
                        value={filmTypeForm.description}
                        onChange={e =>
                            setFilmTypeForm({
                                ...filmTypeForm,
                                description: e.target.value
                            })
                        }
                    />

                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            checked={filmTypeForm.isActive}
                            onChange={e =>
                                setFilmTypeForm({
                                    ...filmTypeForm,
                                    isActive: e.target.checked
                                })
                            }
                        />
                        Активна
                    </label>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => void saveFilmType()}
                        >
                            {editingFilmTypeUuid ? 'Сохранить' : 'Добавить'}
                        </button>

                        {editingFilmTypeUuid && (
                            <button
                                className="btn"
                                onClick={() => {
                                    setEditingFilmTypeUuid(null);
                                    setFilmTypeForm(emptyFilmType);
                                }}
                            >
                                Отмена
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <table>
                <thead>
                <tr>
                    <th>Марка</th>
                    <th>Отображение</th>
                    <th>Плотность</th>
                    <th>Активна</th>
                    <th></th>
                </tr>
                </thead>

                <tbody>
                {filmTypes.map(filmType => (
                    <tr
                        key={filmType.uuid}
                        style={{
                            background:
                                selectedFilmType?.uuid === filmType.uuid
                                    ? 'var(--accent-bg)'
                                    : undefined
                        }}
                    >
                        <td>{filmType.brand}</td>
                        <td>{filmType.displayName}</td>
                        <td>{filmType.densityGcm3 ?? '—'}</td>
                        <td>{filmType.isActive ? 'Да' : 'Нет'}</td>
                        <td>
                            <button
                                className="btn"
                                onClick={() => handleSelectFilmType(filmType)}
                            >
                                Параметры
                            </button>

                            <button
                                className="btn"
                                onClick={() => startEditFilmType(filmType)}
                            >
                                Изменить
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {selectedFilmType && (
                <section className="card" style={{ marginTop: 32 }}>
                    <h2>
                        Параметры марки: {selectedFilmType.brand}
                    </h2>

                    <div style={{ display: 'grid', gap: 12, maxWidth: 520, marginBottom: 24 }}>
                        <input
                            type="number"
                            placeholder="Толщина, мкм"
                            value={paramForm.thicknessMicron || ''}
                            onChange={e =>
                                setParamForm({
                                    ...paramForm,
                                    thicknessMicron: Number(e.target.value)
                                })
                            }
                        />

                        <input
                            type="number"
                            step="0.01"
                            placeholder="Поверхность"
                            value={paramForm.surface}
                            onChange={e =>
                                setParamForm({
                                    ...paramForm,
                                    surface: e.target.value
                                })
                            }
                        />

                        <input
                            type="number"
                            step="0.01"
                            placeholder="Цена, ₽"
                            value={paramForm.price}
                            onChange={e =>
                                setParamForm({
                                    ...paramForm,
                                    price: e.target.value
                                })
                            }
                        />

                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                checked={paramForm.isActive}
                                onChange={e =>
                                    setParamForm({
                                        ...paramForm,
                                        isActive: e.target.checked
                                    })
                                }
                            />
                            Активен
                        </label>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => void saveParam()}
                            >
                                {editingParamUuid ? 'Сохранить параметр' : 'Добавить параметр'}
                            </button>

                            {editingParamUuid && (
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setEditingParamUuid(null);
                                        setParamForm(emptyParam);
                                    }}
                                >
                                    Отмена
                                </button>
                            )}
                        </div>
                    </div>

                    <table>
                        <thead>
                        <tr>
                            <th>Толщина, мкм</th>
                            <th>Поверхность</th>
                            <th>Цена, ₽</th>
                            <th>Активен</th>
                            <th></th>
                        </tr>
                        </thead>

                        <tbody>
                        {params.map(param => (
                            <tr key={param.uuid}>
                                <td>{param.thicknessMicron}</td>
                                <td>{param.surface ?? '—'}</td>
                                <td>{param.price ?? '—'}</td>
                                <td>{param.isActive ? 'Да' : 'Нет'}</td>
                                <td>
                                    <button
                                        className="btn"
                                        onClick={() => startEditParam(param)}
                                    >
                                        Изменить
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}
import { useEffect, useState } from 'react';
import {
    getCounterparties,
    createCounterparty,
    updateCounterparty,
    type Counterparty
} from '../api/counterparties';

const emptyForm = {
    name: '',
    inn: '',
    kpp: '',
    legalAddressText: '',
    isActive: true
};

export default function CounterpartiesPage() {
    const [items, setItems] = useState<Counterparty[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [editingUuid, setEditingUuid] = useState<string | null>(null);
    const [error, setError] = useState('');

    async function load() {
        try {
            const result = await getCounterparties();
            setItems(result.items);
            setError('');
        } catch {
            setError('Не удалось загрузить контрагентов.');
        }
    }

    useEffect(() => {
        load();
    }, []);

    function startEdit(item: Counterparty) {
        setEditingUuid(item.uuid);
        setForm({
            name: item.name,
            inn: item.inn ?? '',
            kpp: item.kpp ?? '',
            legalAddressText: item.legalAddressText ?? '',
            isActive: item.isActive
        });
    }

    function cancelEdit() {
        setEditingUuid(null);
        setForm(emptyForm);
    }

    async function save() {
        if (!form.name.trim()) {
            setError('Укажите наименование контрагента.');
            return;
        }

        const payload = {
            name: form.name.trim(),
            inn: form.inn.trim() || null,
            kpp: form.kpp.trim() || null,
            legalAddressText: form.legalAddressText.trim() || null,
            isActive: form.isActive
        };

        try {
            if (editingUuid) {
                await updateCounterparty(editingUuid, payload);
            } else {
                await createCounterparty(payload);
            }

            cancelEdit();
            await load();
        } catch {
            setError('Не удалось сохранить контрагента.');
        }
    }

    return (
        <div>
            <h1>Контрагенты</h1>

            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

            <section className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
                <h2>{editingUuid ? 'Редактирование' : 'Новый контрагент'}</h2>

                <div style={{ display: 'grid', gap: 12 }}>
                    <input
                        placeholder="Наименование"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                        placeholder="ИНН"
                        value={form.inn}
                        onChange={e => setForm({ ...form, inn: e.target.value })}
                    />
                    <input
                        placeholder="КПП"
                        value={form.kpp}
                        onChange={e => setForm({ ...form, kpp: e.target.value })}
                    />
                    <input
                        placeholder="Юридический адрес"
                        value={form.legalAddressText}
                        onChange={e =>
                            setForm({ ...form, legalAddressText: e.target.value })
                        }
                    />

                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e =>
                                setForm({ ...form, isActive: e.target.checked })
                            }
                        />
                        Активен
                    </label>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" onClick={save}>
                            {editingUuid ? 'Сохранить' : 'Добавить'}
                        </button>

                        {editingUuid && (
                            <button className="btn" onClick={cancelEdit}>
                                Отмена
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <table>
                <thead>
                <tr>
                    <th>Наименование</th>
                    <th>ИНН</th>
                    <th>КПП</th>
                    <th>Адрес</th>
                    <th>Активен</th>
                    <th></th>
                </tr>
                </thead>

                <tbody>
                {items.map(item => (
                    <tr key={item.uuid}>
                        <td>{item.name}</td>
                        <td>{item.inn}</td>
                        <td>{item.kpp}</td>
                        <td>{item.legalAddressText}</td>
                        <td>{item.isActive ? 'Да' : 'Нет'}</td>
                        <td>
                            <button className="btn" onClick={() => startEdit(item)}>
                                Изменить
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
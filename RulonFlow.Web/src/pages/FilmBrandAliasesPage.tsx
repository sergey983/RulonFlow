import { useEffect, useState } from "react";
import {
    getFilmBrandAliases,
    createFilmBrandAlias,
    deleteFilmBrandAlias,
    type FilmBrandAlias,
    type FilmBrandAliasFormValues
} from "../api/filmBrandAliases";

type Supplier = { uuid: string; name: string };
type FilmType = { uuid: string; brand: string };

export default function FilmBrandAliasesPage() {
    const [items, setItems] = useState<FilmBrandAlias[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [filmTypes, setFilmTypes] = useState<FilmType[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<FilmBrandAliasFormValues>({
        supplierUuid: "",
        supplierFilmName: "",
        filmTypeUuid: "",
        isActive: true
    });

    async function load() {
        try {
            const [aliases, suppliersRes, filmTypesRes] = await Promise.all([
                getFilmBrandAliases(),
                fetch("/api/v1/suppliers?pageSize=200").then(r => r.json()),
                fetch("/api/v1/film-types?pageSize=200").then(r => r.json())
            ]);

            setItems(aliases);
            setSuppliers(suppliersRes.items);
            setFilmTypes(filmTypesRes.items);
            setError(null);
        } catch {
            setError("Не удалось загрузить данные справочников");
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function submit(event: React.FormEvent) {
        event.preventDefault();

        try {
            await createFilmBrandAlias(form);
            setForm({
                supplierUuid: "",
                supplierFilmName: "",
                filmTypeUuid: "",
                isActive: true
            });
            await load();
        } catch {
            setError("Не удалось создать соответствие");
        }
    }

    async function remove(uuid: string) {
        try {
            await deleteFilmBrandAlias(uuid);
            await load();
        } catch {
            setError("Не удалось удалить соответствие");
        }
    }

    return (
        <div>
            <h1>Соответствия марок</h1>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={submit}>
                <select
                    value={form.supplierUuid}
                    onChange={e => setForm({ ...form, supplierUuid: e.target.value })}
                    required
                >
                    <option value="">Поставщик</option>
                    {suppliers.map(s => (
                        <option key={s.uuid} value={s.uuid}>
                            {s.name}
                        </option>
                    ))}
                </select>

                <input
                    placeholder="Название у поставщика"
                    value={form.supplierFilmName}
                    onChange={e =>
                        setForm({ ...form, supplierFilmName: e.target.value })
                    }
                    required
                />

                <select
                    value={form.filmTypeUuid}
                    onChange={e => setForm({ ...form, filmTypeUuid: e.target.value })}
                    required
                >
                    <option value="">Наша марка</option>
                    {filmTypes.map(f => (
                        <option key={f.uuid} value={f.uuid}>
                            {f.brand}
                        </option>
                    ))}
                </select>

                <label>
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    />
                    Активно
                </label>

                <button type="submit">Добавить</button>
            </form>

            <table border={1} cellPadding={8}>
                <thead>
                <tr>
                    <th>Поставщик</th>
                    <th>Название у поставщика</th>
                    <th>Наша марка</th>
                    <th>Активно</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item.uuid}>
                        <td>{item.supplierName}</td>
                        <td>{item.supplierFilmName}</td>
                        <td>{item.filmBrand}</td>
                        <td>{item.isActive ? "Да" : "Нет"}</td>
                        <td>
                            <button onClick={() => remove(item.uuid)}>Удалить</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
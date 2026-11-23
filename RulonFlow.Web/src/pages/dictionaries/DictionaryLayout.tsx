import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
    { to: '/dictionaries/film-types', label: 'Марки плёнки' },
    { to: '/dictionaries/film-brand-aliases', label: 'Соответствия марок' },
    { to: '/dictionaries/suppliers', label: 'Поставщики' },
    { to: '/dictionaries/counterparties', label: 'Контрагенты' },
    { to: '/dictionaries/defect-reasons', label: 'Причины брака' },
    { to: '/dictionaries/storage-zones', label: 'Склады' },
    { to: '/dictionaries/receipt-import', label: 'Импорт поступлений' },
    { to: "/dictionaries/pallet-types", label: "Типы паллет" },
];

export default function DictionaryLayout() {
    return (
        <div>
            <h1>Справочники</h1>

            <nav
                style={{
                    display: 'flex',
                    gap: 8,
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: 12,
                    marginBottom: 24
                }}
            >
                {tabs.map(tab => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        style={({ isActive }) => ({
                            padding: '8px 14px',
                            borderRadius: 8,
                            textDecoration: 'none',
                            background: isActive ? '#2563eb' : '#e5e7eb',
                            color: isActive ? '#fff' : '#374151',
                            fontWeight: isActive ? 600 : 400
                        })}
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </nav>

            <Outlet />
        </div>
    );
}
import { NavLink, Outlet } from 'react-router-dom';
import './DictionaryLayout.css';

const tabs = [
    { to: '/dictionaries/film-types', label: 'Марки плёнки', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { to: '/dictionaries/film-type-params', label: 'Параметры плёнки', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { to: '/dictionaries/film-brand-aliases', label: 'Соответствия марок', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { to: '/dictionaries/suppliers', label: 'Поставщики', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { to: '/dictionaries/counterparties', label: 'Контрагенты', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { to: '/dictionaries/defect-reasons', label: 'Причины брака', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { to: '/dictionaries/storage-zones', label: 'Склады', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/dictionaries/pallet-types', label: 'Типы паллет', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
];

export default function DictionaryLayout() {
    return (
        <div className="dictionary-layout">
            <div className="dictionary-layout__header">
                <h1>Справочники</h1>
            </div>

            <nav className="dictionary-tabs">
                {tabs.map(tab => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={({ isActive }) =>
                            `dictionary-tab ${isActive ? 'dictionary-tab--active' : ''}`
                        }
                    >
                        <svg className="dictionary-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={tab.icon} />
                        </svg>
                        <span>{tab.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="dictionary-layout__content">
                <Outlet />
            </div>
        </div>
    );
}

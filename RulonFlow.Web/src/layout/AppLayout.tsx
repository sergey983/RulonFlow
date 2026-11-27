import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './AppLayout.css';

interface MenuItem {
    to: string;
    label: string;
    icon: string;
}

const menu: MenuItem[] = [
    {
        to: '/',
        label: 'Главная',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
        to: '/dictionaries',
        label: 'Справочники',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
    },
    {
        to: '/warehouse',
        label: 'Кладовщик',
        icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z'
    },
    {
        to: '/technologist',
        label: 'Технолог',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    },
    {
        to: '/print',
        label: 'Печатник',
        icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
    },
    {
        to: '/lamination',
        label: 'Ламинаторщик',
        icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z'
    },
    {
        to: '/cutting',
        label: 'Резчик',
        icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z'
    },
    {
        to: '/packing',
        label: 'Упаковщик',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    {
        to: '/logistics',
        label: 'Логист',
        icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0'
    },
    {
        to: '/admin',
        label: 'Администрирование',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    }
];

export default function AppLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, clearAuth } = useAuth();
    const navigate = useNavigate();

    const initials = user
        ? user.fullName
              .split(/\s+/)
              .slice(0, 2)
              .map(p => p.charAt(0).toUpperCase())
              .join('')
        : '??';

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    const roleName = user && user.roles && user.roles.length > 0
        ? user.roles.join(', ')
        : 'Пользователь';

    return (
        <div className={`app ${isCollapsed ? 'app--collapsed' : ''}`}>
            <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
                <div className="sidebar__brand">
                    <svg className="sidebar__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="sidebar__title">RulonFlow</span>
                </div>

                <button
                    className="sidebar__toggle"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`sidebar__toggle-icon ${isCollapsed ? 'sidebar__toggle-icon--rotated' : ''}`}>
                        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </button>

                <nav className="sidebar__nav">
                    {menu.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                            }
                            title={isCollapsed ? item.label : undefined}
                        >
                            <svg className="sidebar__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d={item.icon} />
                            </svg>
                            {!isCollapsed && <span className="sidebar__link-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar__footer">
                    {!isCollapsed && <span className="sidebar__version">v1.0</span>}
                </div>
            </aside>

            <div className="content">
                <header className="topbar">
                    <div className="topbar__search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input type="text" placeholder="Поиск..." className="topbar__search-input" />
                    </div>

                    <div className="topbar__actions">
                        <button className="topbar__icon-btn" title="Уведомления">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 01-3.46 0" />
                            </svg>
                            <span className="topbar__badge" />
                        </button>

                        <div className="topbar__user">
                            <div className="topbar__avatar">{initials}</div>
                            <div className="topbar__user-info">
                                <span className="topbar__user-name">{user?.fullName ?? ''}</span>
                                <span className="topbar__user-role">{roleName}</span>
                            </div>
                            <button
                                className="topbar__logout-btn"
                                onClick={handleLogout}
                                title="Выйти из системы"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="page">
                    <div className="page__inner animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

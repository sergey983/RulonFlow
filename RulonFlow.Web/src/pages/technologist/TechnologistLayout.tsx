import { NavLink, Outlet } from 'react-router-dom';
import './TechnologistLayout.css';

const tabs = [
    { to: '/technologist/import', label: 'Импорт', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { to: '/technologist/cutting', label: 'Резка', icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z' },
    { to: '/technologist/printing', label: 'Печать', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
    { to: '/technologist/lamination', label: 'Ламинация', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
];

export default function TechnologistLayout() {
    return (
        <div className="technologist-layout">
            <div className="technologist-layout__header">
                <h1>Рабочее место технолога</h1>
            </div>

            <nav className="technologist-tabs">
                {tabs.map(tab => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={({ isActive }) =>
                            `technologist-tab ${isActive ? 'technologist-tab--active' : ''}`
                        }
                    >
                        <svg className="technologist-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={tab.icon} />
                        </svg>
                        <span>{tab.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="technologist-layout__content">
                <Outlet />
            </div>
        </div>
    );
}

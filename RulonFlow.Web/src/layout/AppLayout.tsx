import { NavLink, Outlet } from 'react-router-dom';
import './AppLayout.css';

const menu = [
    { to: '/', label: 'Главная' },
    { to: '/dictionaries', label: 'Справочники' },
    { to: '/warehouse', label: 'Кладовщик' },
    { to: '/print', label: 'Печатник' },
    { to: '/lamination', label: 'Ламинаторщик' },
    { to: '/cutting', label: 'Резчик' },
    { to: '/packing', label: 'Упаковщик' },
    { to: '/logistics', label: 'Логист' },
    { to: '/admin', label: 'Администрирование' }
];

export default function AppLayout() {
    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">RulonFlow</div>

                <nav className="menu">
                    {menu.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                isActive ? 'menu-link active' : 'menu-link'
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="content">
                <header className="topbar">
                    <div>Рабочее место</div>
                    <div className="user">Сизов С. В.</div>
                </header>

                <main className="page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
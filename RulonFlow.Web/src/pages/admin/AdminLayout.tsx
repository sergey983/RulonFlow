import { NavLink, Outlet } from 'react-router-dom';
import { useHasPermission } from '../../auth/useHasPermission';
import './AdminLayout.css';

export default function AdminLayout() {
    const canManageUsers = useHasPermission('users:manage');
    const canManageRoles = useHasPermission('roles:manage');

    return (
        <div className="admin-layout">
            <div className="admin-layout__header">
                <h1>Администрирование</h1>
            </div>

            <nav className="admin-tabs">
                {canManageUsers && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            `admin-tab ${isActive ? 'admin-tab--active' : ''}`
                        }
                    >
                        <svg className="admin-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Пользователи</span>
                    </NavLink>
                )}
                {canManageRoles && (
                    <NavLink
                        to="/admin/roles"
                        className={({ isActive }) =>
                            `admin-tab ${isActive ? 'admin-tab--active' : ''}`
                        }
                    >
                        <svg className="admin-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>Роли</span>
                    </NavLink>
                )}
                {!canManageUsers && !canManageRoles && (
                    <div className="admin-tabs--empty">
                        <span className="text-muted">Нет доступных разделов</span>
                    </div>
                )}
            </nav>

            <div className="admin-layout__content">
                <Outlet />
            </div>
        </div>
    );
}

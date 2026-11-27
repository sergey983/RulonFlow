import './HomePage.css';

interface WorkPlace {
    to: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    comingSoon?: boolean;
}

const workPlaces: WorkPlace[] = [
    {
        to: '/warehouse',
        label: 'Кладовщик',
        description: 'Управление складскими операциями',
        icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
        color: 'var(--accent)'
    },
    {
        to: '/print',
        label: 'Печатник',
        description: 'Контроль печати этикеток',
        icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
        color: 'var(--info)'
    },
    {
        to: '/lamination',
        label: 'Ламинаторщик',
        description: 'Контроль процесса ламинирования',
        icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
        color: 'var(--warning)'
    },
    {
        to: '/cutting',
        label: 'Резчик',
        description: 'Контроль резки плёнки',
        icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
        color: 'var(--success)'
    },
    {
        to: '/packing',
        label: 'Упаковщик',
        description: 'Управление упаковкой',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        color: '#7c3aed'
    },
    {
        to: '/logistics',
        label: 'Логист',
        description: 'Планирование логистики',
        icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
        color: 'var(--danger)'
    }
];

export default function HomePage() {
    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Добро пожаловать в RulonFlow</h1>
                    <p className="dashboard__subtitle">Выберите рабочее место для начала работы</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--accent">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                    </div>
                    <span className="stat-card__value">12</span>
                    <span className="stat-card__label">Пользователей</span>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="stat-card__value">847</span>
                    <span className="stat-card__label">Контрагентов</span>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--warning">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <span className="stat-card__value">156</span>
                    <span className="stat-card__label">Марок плёнки</span>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--danger">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <span className="stat-card__value">23</span>
                    <span className="stat-card__label">Причины брака</span>
                </div>
            </div>

            <div className="section-header">
                <div className="section-header__title">
                    <h2>Рабочие места</h2>
                    <p className="section-header__subtitle">Выберите модуль для работы</p>
                </div>
            </div>

            <div className="workplaces-grid">
                {workPlaces.map(wp => (
                    <a
                        key={wp.to}
                        href={wp.to}
                        className="workplace-card"
                        style={{'--wp-color': wp.color} as React.CSSProperties}
                    >
                        <div className="workplace-card__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d={wp.icon} />
                            </svg>
                        </div>
                        <div className="workplace-card__content">
                            <h3 className="workplace-card__title">{wp.label}</h3>
                            <p className="workplace-card__desc">{wp.description}</p>
                        </div>
                        <svg className="workplace-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </a>
                ))}
            </div>
        </div>
    );
}

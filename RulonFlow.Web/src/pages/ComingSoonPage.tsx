import Card from '../ui/Card';
import './ComingSoonPage.css';

interface ComingSoonPageProps {
    title: string;
}

export default function ComingSoonPage({ title }: ComingSoonPageProps) {
    return (
        <div className="coming-soon">
            <Card className="coming-soon__card">
                <div className="coming-soon__icon">🚧</div>
                <h1>{title}</h1>
                <p className="text-muted">Этот модуль находится в разработке. Скоро будет доступен.</p>
            </Card>
        </div>
    );
}

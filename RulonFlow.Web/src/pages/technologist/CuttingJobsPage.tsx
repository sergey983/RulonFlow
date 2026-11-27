import Card from '../../ui/Card';
import './TechnologistJobsPage.css';

export default function CuttingJobsPage() {
    return (
        <div className="entity-page">
            <Card className="jobs-placeholder">
                <div className="jobs-placeholder__icon">✂️</div>
                <h2>Задания на резку</h2>
                <p className="text-muted">Создание и управление заданиями на резку плёнки.</p>
                <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                    Функционал в разработке.
                </p>
            </Card>
        </div>
    );
}

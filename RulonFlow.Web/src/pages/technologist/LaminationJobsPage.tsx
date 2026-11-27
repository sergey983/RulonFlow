import Card from '../../ui/Card';

export default function LaminationJobsPage() {
    return (
        <div className="entity-page">
            <Card className="jobs-placeholder">
                <div className="jobs-placeholder__icon">📄</div>
                <h2>Задания на ламинацию</h2>
                <p className="text-muted">Создание и управление заданиями на ламинацию.</p>
                <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                    Функционал в разработке.
                </p>
            </Card>
        </div>
    );
}

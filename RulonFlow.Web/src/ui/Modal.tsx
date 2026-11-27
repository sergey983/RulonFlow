import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    width?: number;
    wide?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, actions, width = 520, wide = false }: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-card${wide ? ' modal-card--wide' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: wide ? undefined : width }}
            >
                <div className="modal-card__header">
                    <h2>{title}</h2>
                    <button className="modal-card__close" onClick={onClose} aria-label="Закрыть">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="modal-card__body">
                    {children}
                    {actions && (
                        <div className="modal-card__actions">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

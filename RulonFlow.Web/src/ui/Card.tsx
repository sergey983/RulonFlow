import React from 'react';
import './ui.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    hoverable?: boolean;
}

export default function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
    return (
        <div
            className={`card ${hoverable ? 'card--hoverable' : ''} ${className}`.trim()}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}

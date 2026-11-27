import React from 'react';
import './ui.css';

interface TableProps {
    children: React.ReactNode;
    className?: string;
    striped?: boolean;
    hoverable?: boolean;
    size?: 'sm' | 'md' | 'lg';
    style?: React.CSSProperties;
}

export default function Table({
    children,
    className = '',
    striped = false,
    hoverable = true,
    size = 'md',
    style,
}: TableProps) {
    return (
        <div className="table-wrapper" style={style}>
            <table
                className={`table table--striped-${striped} table--hoverable-${hoverable} table--${size} ${className}`.trim()}
            >
                {children}
            </table>
        </div>
    );
}

interface TableHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
    return <thead className={`table__header ${className}`.trim()}>{children}</thead>;
}

interface TableBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function TableBody({ children, className = '' }: TableBodyProps) {
    return <tbody className={`table__body ${className}`.trim()}>{children}</tbody>;
}

interface TableRowProps {
    children: React.ReactNode;
    className?: string;
    highlighted?: boolean;
}

export function TableRow({ children, className = '', highlighted = false }: TableRowProps) {
    return (
        <tr className={`table__row ${highlighted ? 'table__row--highlighted' : ''} ${className}`.trim()}>
            {children}
        </tr>
    );
}

interface TableCellProps {
    children: React.ReactNode;
    className?: string;
    th?: boolean;
    colSpan?: number;
}

export function TableCell({ children, className = '', th = false, colSpan }: TableCellProps) {
    const Tag = th ? 'th' : 'td';
    return (
        <Tag className={`table__cell ${className}`.trim()} colSpan={colSpan}>
            {children}
        </Tag>
    );
}

import React from 'react';
import './ui.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helpText?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export default function Select({
    label,
    error,
    helpText,
    options,
    placeholder,
    className = '',
    id,
    ...props
}: SelectProps) {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;

    return (
        <div className={`input-wrapper ${className}`.trim()}>
            {label && (
                <label htmlFor={selectId} className="input-label">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={`select ${error ? 'select--error' : ''}`}
                aria-invalid={!!error}
                {...props}
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="input-error">{error}</p>
            )}
            {helpText && !error && (
                <p className="input-help">{helpText}</p>
            )}
        </div>
    );
}

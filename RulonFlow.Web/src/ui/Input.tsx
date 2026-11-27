import React from 'react';
import './ui.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helpText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function Input({
    label,
    error,
    helpText,
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...props
}: InputProps) {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
        <div className={`input-wrapper ${className}`.trim()}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <div className={`input-field ${leftIcon ? 'input-field--with-prefix' : ''} ${rightIcon ? 'input-field--with-suffix' : ''}`}>
                {leftIcon && (
                    <span className="input-prefix">{leftIcon}</span>
                )}
                <input
                    id={inputId}
                    className={`input ${error ? 'input--error' : ''}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
                    {...props}
                />
                {rightIcon && (
                    <span className="input-suffix">{rightIcon}</span>
                )}
            </div>
            {error && (
                <p id={`${inputId}-error`} className="input-error">{error}</p>
            )}
            {helpText && !error && (
                <p id={`${inputId}-help`} className="input-help">{helpText}</p>
            )}
        </div>
    );
}

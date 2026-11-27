import React from 'react';
import './ui.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || isLoading;

    return (
        <button
            className={`btn btn--${variant} btn--${size} ${className}`.trim()}
            disabled={isDisabled}
            {...props}
        >
            {isLoading && (
                <span className="btn__spinner" />
            )}
            {!isLoading && leftIcon && (
                <span className="btn__icon btn__icon--left">{leftIcon}</span>
            )}
            <span className="btn__content">{children}</span>
            {!isLoading && rightIcon && (
                <span className="btn__icon btn__icon--right">{rightIcon}</span>
            )}
        </button>
    );
}

'use client';

import React from 'react';

interface InputProps {
    id: string;
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    error?: string;
    className?: string;
}

const Input: React.FC<InputProps> = ({
    id,
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
    required = false,
    error,
    className = '',
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={id} className={`block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 ${required ? 'required' : ''}`}>
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="custom-input focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
};

export default Input;
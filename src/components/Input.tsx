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
                <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black`}
                suppressHydrationWarning // Add this prop to ignore hydration mismatches on this element
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default Input;
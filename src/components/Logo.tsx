import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({
    className = '',
    showText = true,
    size = 'md'
}) => {
    // Size mappings
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    const textSizes = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl'
    };

    return (
        <div className={`flex items-center ${className}`}>
            {/* Book icon */}
            <div className={`${sizeClasses[size]} text-primary-600 dark:text-primary-400`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm8 16H6V4h1v9l3-2.25L13 13V4h4v16z" />
                </svg>
            </div>

            {/* Text */}
            {showText && (
                <div className={`ml-2 font-bold tracking-wider ${textSizes[size]} text-primary-600 dark:text-primary-400`}>
                    STORY POINTS
                </div>
            )}
        </div>
    );
};

export default Logo;
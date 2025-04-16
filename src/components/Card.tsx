import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`card p-6 border border-gray-100 dark:border-gray-800 shadow-sm ${className}`}>
            {children}
        </div>
    );
};

export default Card;
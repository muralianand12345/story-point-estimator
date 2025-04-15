import React from 'react';

interface VotingCardProps {
    value: string;
    selected: boolean;
    onClick: (value: string) => void;
    disabled?: boolean;
}

const VotingCard: React.FC<VotingCardProps> = ({
    value,
    selected,
    onClick,
    disabled = false,
}) => {
    const handleClick = () => {
        if (!disabled) {
            onClick(value);
        }
    };

    return (
        <button
            className={`
                w-16 h-24 rounded-lg shadow-sm font-bold text-lg flex items-center justify-center 
                transition-all transform hover:scale-105 focus:outline-none
                ${selected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-900 border border-gray-200'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={handleClick}
            disabled={disabled}
            type="button"
        >
            {value}
        </button>
    );
};

export default VotingCard;
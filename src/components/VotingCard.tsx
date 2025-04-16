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
            className={`voting-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={handleClick}
            disabled={disabled}
            type="button"
            aria-pressed={selected}
        >
            {value}
        </button>
    );
};

export default VotingCard;
import React from 'react';

interface EstimationCardProps {
    value: string;
    selected: boolean;
    onClick: () => void;
    revealed: boolean;
    count?: number;
}

const EstimationCard: React.FC<EstimationCardProps> = ({
    value,
    selected,
    onClick,
    revealed,
    count,
}) => {
    return (
        <div
            className={`
        w-20 h-28 rounded-lg flex flex-col items-center justify-center
        border-2 shadow-md cursor-pointer transition-all transform
        ${selected ? 'border-blue-500 scale-105' : 'border-gray-300'}
        ${revealed ? 'bg-white' : 'bg-white hover:bg-gray-50'}
      `}
            onClick={onClick}
        >
            <div className="text-2xl font-bold">{value}</div>
            {revealed && count !== undefined && (
                <div className="mt-2 text-sm text-gray-600">
                    {count} vote{count !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default EstimationCard;
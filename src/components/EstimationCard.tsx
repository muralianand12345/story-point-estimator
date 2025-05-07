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
        w-20 h-28 rounded-xl flex flex-col items-center justify-center
        border-2 shadow-lg cursor-pointer transition-all transform 
        ${selected ? 'border-blue-500 bg-blue-50 scale-110' : 'border-gray-300 hover:border-blue-300'}
        ${revealed ? 'bg-white' : 'bg-white hover:bg-gray-50'}
      `}
            onClick={onClick}
        >
            <div className={`text-2xl font-bold ${selected ? 'text-blue-600' : 'text-gray-800'}`}>
                {value}
            </div>
            {revealed && count !== undefined && (
                <div className={`mt-2 px-2 py-1 rounded-full ${count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {count} {count === 1 ? 'vote' : 'votes'}
                </div>
            )}
        </div>
    );
};

export default EstimationCard;
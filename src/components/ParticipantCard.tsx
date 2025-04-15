import React from 'react';

interface ParticipantCardProps {
    name: string;
    isHost: boolean;
    hasVoted: boolean;
    vote: string | null;
    isRevealed: boolean;
    isSelf: boolean;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
    name,
    isHost,
    hasVoted,
    vote,
    isRevealed,
    isSelf,
}) => {
    return (
        <div className={`
      flex items-center p-3 rounded-lg 
      ${isSelf ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'} 
      shadow-sm
    `}>
            <div className="flex-1">
                <div className="flex items-center">
                    <span className="font-medium text-indigo-600">{name}</span>
                    {isSelf && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                    {isHost && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            Host
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center">
                {isRevealed ? (
                    <div className={`
            w-8 h-8 flex items-center justify-center rounded-full 
            ${vote ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-500'}
            font-medium text-sm
          `}>
                        {vote || '?'}
                    </div>
                ) : (
                    <div className={`
            px-2 py-1 text-xs rounded-full
            ${hasVoted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'}
          `}>
                        {hasVoted ? 'Voted' : 'Waiting'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantCard;
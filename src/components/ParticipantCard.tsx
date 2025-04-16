'use client';

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
      ${isSelf
                ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'} 
      transition-colors
    `}>
            <div className="flex-1">
                <div className="flex items-center">
                    <span className="font-medium text-purple-600 dark:text-purple-400">{name}</span>
                    {isSelf && <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">(You)</span>}
                    {isHost && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded">
                            Host
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center">
                {isRevealed ? (
                    <div className={`
            w-8 h-8 flex items-center justify-center rounded-full 
            ${vote
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
            font-medium text-sm
          `}>
                        {vote || '?'}
                    </div>
                ) : (
                    <div className={`
            px-2 py-1 text-xs rounded-full
            ${hasVoted
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'}
          `}>
                        {hasVoted ? 'Voted' : 'Waiting'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantCard;
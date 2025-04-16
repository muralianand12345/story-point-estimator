import React from 'react';
import { calculateVoteStats } from '../utils/roomUtils';
import Card from './Card';

interface VotingResultProps {
    votes: (string | null)[];
    votingOptions: string[];
}

const VotingResult: React.FC<VotingResultProps> = ({ votes, votingOptions }) => {
    const stats = calculateVoteStats(votes);

    return (
        <Card className="mt-6">
            <h3 className="text-lg font-medium mb-4 text-primary-700 dark:text-primary-400">Voting Results</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Average</h4>
                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{stats.average}</p>
                </div>
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Consensus</h4>
                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{stats.mode || '-'}</p>
                </div>
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Min</h4>
                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{stats.min}</p>
                </div>
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Max</h4>
                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{stats.max}</p>
                </div>
            </div>

            <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Distribution</h4>
            <div className="flex justify-between items-end space-x-2 h-32">
                {votingOptions.map(option => {
                    const count = stats.distribution[option] || 0;
                    const percentage = votes.length > 0 ? (count / votes.filter(v => v !== null).length) * 100 : 0;

                    return (
                        <div key={option} className="flex flex-col items-center flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{count > 0 ? count : ''}</div>
                            <div
                                className="w-full rounded-t"
                                style={{
                                    height: `${Math.max(percentage, 4)}%`,
                                    backgroundColor: count > 0 ? 'var(--primary-600)' : 'var(--border-color)'
                                }}
                            />
                            <div className="text-xs font-medium mt-1">{option}</div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default VotingResult;
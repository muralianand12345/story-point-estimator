import React, { useState, useEffect } from 'react';
import EstimationCard from './EstimationCard';
import { Vote } from '@/lib/types';

interface VotingPanelProps {
    storyId: string;
    userId: string;
    roomId: string;
    isRevealed: boolean;
    votes: Vote[];
    onVote: (value: string) => void;
    onReveal: () => void;
    onReset: () => void;
    onNextStory: () => void;
    isAdmin: boolean;
}

// Common story point values
const STORY_POINTS = ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?'];

const VotingPanel: React.FC<VotingPanelProps> = ({
    storyId,
    userId,
    votes,
    isRevealed,
    onVote,
    onReveal,
    onReset,
    onNextStory,
    isAdmin,
}) => {
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [revealAnimation, setRevealAnimation] = useState(false);

    // Find the user's vote
    useEffect(() => {
        const userVote = votes.find(vote => vote.userId === userId);
        if (userVote) {
            setSelectedValue(userVote.value);
        } else {
            setSelectedValue(null);
        }
    }, [votes, userId]);

    // Animation for reveal
    useEffect(() => {
        if (isRevealed) {
            setRevealAnimation(true);
            const timer = setTimeout(() => {
                setRevealAnimation(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isRevealed]);

    // Count votes for each value
    const getVoteCounts = () => {
        const counts: Record<string, number> = {};
        STORY_POINTS.forEach(point => {
            counts[point] = 0;
        });

        votes.forEach(vote => {
            if (counts[vote.value] !== undefined) {
                counts[vote.value]++;
            }
        });

        return counts;
    };

    const voteCounts = getVoteCounts();

    // Calculate average (excluding '?' and non-numeric values)
    const calculateAverage = () => {
        if (votes.length === 0) return 0;

        const numericVotes = votes.filter(vote => {
            const value = vote.value === '½' ? 0.5 : parseFloat(vote.value);
            return !isNaN(value);
        });

        if (numericVotes.length === 0) return 0;

        const sum = numericVotes.reduce((acc, vote) => {
            const value = vote.value === '½' ? 0.5 : parseFloat(vote.value);
            return acc + value;
        }, 0);

        return sum / numericVotes.length;
    };

    const handleCardClick = (value: string) => {
        setSelectedValue(value);
        onVote(value);
    };

    return (
        <div className="mt-6">
            <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8 ${revealAnimation ? 'animate-pulse' : ''}`}>
                {STORY_POINTS.map(value => (
                    <EstimationCard
                        key={value}
                        value={value}
                        selected={selectedValue === value}
                        onClick={() => handleCardClick(value)}
                        revealed={isRevealed}
                        count={isRevealed ? voteCounts[value] : undefined}
                    />
                ))}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-4">
                <div className="flex gap-4">
                    {!isRevealed && votes.length > 0 && isAdmin && (
                        <button
                            onClick={onReveal}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Reveal Votes
                        </button>
                    )}

                    {isRevealed && isAdmin && (
                        <>
                            <button
                                onClick={onReset}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset Votes
                            </button>
                            <button
                                onClick={onNextStory}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                                Next Story
                            </button>
                        </>
                    )}
                </div>

                {isRevealed && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-5 rounded-lg shadow-md">
                        <p className="text-2xl font-bold text-blue-800">
                            Average: {calculateAverage().toFixed(1)} points
                        </p>
                        <p className="text-sm text-gray-600">
                            {votes.length} vote{votes.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VotingPanel;
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

    // Find the user's vote
    useEffect(() => {
        const userVote = votes.find(vote => vote.userId === userId);
        if (userVote) {
            setSelectedValue(userVote.value);
        } else {
            setSelectedValue(null);
        }
    }, [votes, userId]);

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
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mb-6">
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
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Reveal Votes
                        </button>
                    )}

                    {isRevealed && isAdmin && (
                        <>
                            <button
                                onClick={onReset}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Reset Votes
                            </button>
                            <button
                                onClick={onNextStory}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Next Story
                            </button>
                        </>
                    )}
                </div>

                {isRevealed && (
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-lg font-semibold">
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
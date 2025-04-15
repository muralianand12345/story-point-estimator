'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '../../../context/RoomContext';
import Header from '../../../components/Header';
import Card from '../../../components/Card';
import VotingCard from '../../../components/VotingCard';
import ParticipantCard from '../../../components/ParticipantCard';
import VotingResult from '../../../components/VotingResult';
import ShareRoom from '../../../components/ShareRoom';
import Button from '../../../components/Button';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;

    const { room, userId, joinRoom, submitVote, revealVotes, resetVotes, checkRoomExists } = useRoom();
    const [selectedVote, setSelectedVote] = useState<string | null>(null);

    // Check if user is in this room and if room exists
    useEffect(() => {
        if (!roomId) return;

        // If not in this room or room doesn't exist, redirect to home
        if (!room || room.id !== roomId || !checkRoomExists(roomId)) {
            router.push('/');
            return;
        }

        // Get current vote if any
        if (room && userId) {
            const participant = room.participants.find(p => p.id === userId);
            if (participant && participant.vote) {
                setSelectedVote(participant.vote);
            }
        }
    }, [room, userId, roomId, router, checkRoomExists]);

    // If not in a room, show loading screen
    if (!room || room.id !== roomId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    const isHost = room.participants.find(p => p.id === userId)?.isHost || false;
    const allVoted = room.participants.every(p => p.vote !== null);

    // Handle vote selection
    const handleVoteSelect = (vote: string) => {
        setSelectedVote(vote);
        submitVote(vote);
    };

    // Handle reveal votes
    const handleRevealVotes = () => {
        revealVotes();
    };

    // Handle reset voting
    const handleResetVoting = () => {
        resetVotes();
        setSelectedVote(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
                    {room.description && (
                        <p className="text-gray-600 mt-1">{room.description}</p>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <Card>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium text-gray-900">Cast Your Vote</h2>

                                {isHost && (
                                    <div className="flex space-x-2">
                                        {!room.isRevealed ? (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={handleRevealVotes}
                                                disabled={!allVoted}
                                            >
                                                Reveal Votes
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleResetVoting}
                                            >
                                                Reset Voting
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                                {room.votingOptions.map((option) => (
                                    <VotingCard
                                        key={option}
                                        value={option}
                                        selected={selectedVote === option}
                                        onClick={handleVoteSelect}
                                        disabled={room.isRevealed}
                                    />
                                ))}
                            </div>

                            {room.isRevealed && (
                                <VotingResult
                                    votes={room.participants.map(p => p.vote)}
                                    votingOptions={room.votingOptions}
                                />
                            )}
                        </Card>
                    </div>

                    <div>
                        {isHost && <ShareRoom roomId={room.id} />}

                        <Card>
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Participants ({room.participants.length})
                            </h2>

                            <div className="space-y-2">
                                {room.participants.map((participant) => (
                                    <ParticipantCard
                                        key={participant.id}
                                        name={participant.name}
                                        isHost={participant.isHost}
                                        hasVoted={participant.vote !== null}
                                        vote={participant.vote}
                                        isRevealed={room.isRevealed}
                                        isSelf={participant.id === userId}
                                    />
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
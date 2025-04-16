'use client';

import React from 'react';
import ParticipantCard from './ParticipantCard';

interface ParticipantListProps {
    participants: {
        id: string;
        name: string;
        isHost: boolean;
        vote: string | null;
    }[];
    isRevealed: boolean;
    participantId: string | null;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
    participants,
    isRevealed,
    participantId
}) => {
    // Deduplicate participants by name (except for host)
    const uniqueParticipants = participants.reduce((acc, current) => {
        // Always include the host
        if (current.isHost) {
            return [...acc, current];
        }

        // Check if we already have a non-host participant with this name
        const isDuplicate = acc.some(item =>
            !item.isHost && item.name === current.name
        );

        if (!isDuplicate) {
            return [...acc, current];
        }

        return acc;
    }, [] as typeof participants);

    return (
        <div className="space-y-2">
            {uniqueParticipants.map((participant) => (
                <ParticipantCard
                    key={participant.id}
                    name={participant.name}
                    isHost={participant.isHost}
                    hasVoted={participant.vote !== null}
                    vote={participant.vote}
                    isRevealed={isRevealed}
                    isSelf={participant.id === participantId}
                />
            ))}
        </div>
    );
};

export default ParticipantList;
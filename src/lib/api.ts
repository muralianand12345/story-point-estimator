import { pusherClient, EVENTS } from './pusher';

// Room Types
export interface Participant {
    id: string;
    name: string;
    vote: string | null;
    isHost: boolean;
    roomId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Room {
    id: string;
    name: string;
    description: string | null;
    participants: Participant[];
    votingOptions: string[];
    isRevealed: boolean;
    createdAt: string;
    updatedAt: string;
}

// Create a new room
export async function createRoom(
    name: string,
    description: string,
    hostName: string
): Promise<Room> {
    const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, hostName }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create room');
    }

    return response.json();
}

// Get a room by ID
export async function getRoom(roomId: string): Promise<Room | null> {
    try {
        const response = await fetch(`/api/rooms/${roomId}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch room');
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching room:', error);
        return null;
    }
}

// Join a room as a participant
export async function joinRoom(
    roomId: string,
    participantName: string
): Promise<{ participant: Participant; room: Room } | null> {
    try {
        const response = await fetch(`/api/rooms/${roomId}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: participantName }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to join room');
        }

        return response.json();
    } catch (error) {
        console.error('Error joining room:', error);
        return null;
    }
}

// Leave a room (remove participant)
export async function leaveRoom(
    roomId: string,
    participantId: string
): Promise<{ roomDeleted: boolean; room?: Room }> {
    const response = await fetch(
        `/api/rooms/${roomId}/participants/${participantId}`,
        {
            method: 'DELETE',
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave room');
    }

    return response.json();
}

// Submit a vote
export async function submitVote(
    roomId: string,
    participantId: string,
    vote: string
): Promise<Room> {
    const response = await fetch(
        `/api/rooms/${roomId}/participants/${participantId}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vote }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit vote');
    }

    return response.json();
}

// Reveal votes
export async function revealVotes(roomId: string): Promise<Room> {
    const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRevealed: true }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reveal votes');
    }

    return response.json();
}

// Reset votes
export async function resetVotes(roomId: string): Promise<Room> {
    const response = await fetch(`/api/rooms/${roomId}/reset`, {
        method: 'POST',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset votes');
    }

    return response.json();
}

// Check if a room exists
export async function checkRoomExists(roomId: string): Promise<boolean> {
    try {
        const room = await getRoom(roomId);
        return !!room;
    } catch (error) {
        return false;
    }
}

// Subscribe to room updates via WebSocket
export function subscribeToRoom(
    roomId: string,
    callbacks: {
        onUpdate?: (room: Room) => void;
        onParticipantJoin?: (data: { participant: Participant; room: Room }) => void;
        onParticipantLeave?: (data: { participantId: string; room?: Room; roomDeleted: boolean }) => void;
        onVoteSubmit?: (room: Room) => void;
        onVotesReveal?: (room: Room) => void;
        onVotesReset?: (room: Room) => void;
    }
): () => void {
    if (!pusherClient) {
        console.warn('Pusher client not initialized. Real-time updates disabled.');
        return () => { }; // Return no-op unsubscribe function
    }

    const channelName = `room-${roomId}`;
    const channel = pusherClient.subscribe(channelName);

    // Set up event handlers
    if (callbacks.onUpdate) {
        channel.bind(EVENTS.ROOM_UPDATED, callbacks.onUpdate);
    }

    if (callbacks.onParticipantJoin) {
        channel.bind(EVENTS.PARTICIPANT_JOINED, callbacks.onParticipantJoin);
    }

    if (callbacks.onParticipantLeave) {
        channel.bind(EVENTS.PARTICIPANT_LEFT, callbacks.onParticipantLeave);
    }

    if (callbacks.onVoteSubmit) {
        channel.bind(EVENTS.VOTE_SUBMITTED, callbacks.onVoteSubmit);
    }

    if (callbacks.onVotesReveal) {
        channel.bind(EVENTS.VOTES_REVEALED, callbacks.onVotesReveal);
    }

    if (callbacks.onVotesReset) {
        channel.bind(EVENTS.VOTES_RESET, callbacks.onVotesReset);
    }

    // Return unsubscribe function
    return () => {
        channel.unbind_all();
        pusherClient.unsubscribe(channelName);
    };
}
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
    if (!roomId || !participantName) {
        console.error('Invalid room ID or participant name for joining room');
        return null;
    }

    try {
        const formattedRoomId = roomId.trim().toUpperCase();

        const response = await fetch(`/api/rooms/${formattedRoomId}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: participantName }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Join room response error:', errorData);
            throw new Error(errorData.error || `Failed to join room: ${response.status}`);
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

    if (!roomId || !participantId) {
        throw new Error('Invalid room or participant ID');
    }

    try {
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
            const errorData = await response.json().catch(() => ({}));
            console.error('Submit vote response error:', errorData);
            throw new Error(errorData.error || `Failed to submit vote: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Submit vote error details:', error);
        throw error;
    }
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
    } catch (_) {
        return false;
    }
}
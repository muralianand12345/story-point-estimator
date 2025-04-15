"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '@/lib/api';

// Define types
type Participant = api.Participant;

type Room = api.Room;

interface RoomContextType {
    room: Room | null;
    userId: string | null;
    participantId: string | null;  // Make this accessible
    isLoading: boolean;
    error: string | null;
    createRoom: (name: string, description: string, hostName: string) => Promise<string>;
    joinRoom: (roomId: string, participantName: string) => Promise<boolean>;
    leaveRoom: () => Promise<void>;
    submitVote: (vote: string) => Promise<void>;
    revealVotes: () => Promise<void>;
    resetVotes: () => Promise<void>;
    checkRoomExists: (roomId: string) => Promise<boolean>;
    refreshRoom: (roomId: string) => Promise<void>;
}

// Create context with default values
const RoomContext = createContext<RoomContextType>({
    room: null,
    userId: null,
    participantId: null,
    isLoading: false,
    error: null,
    createRoom: async () => '',
    joinRoom: async () => false,
    leaveRoom: async () => { },
    submitVote: async () => { },
    revealVotes: async () => { },
    resetVotes: async () => { },
    checkRoomExists: async () => false,
    refreshRoom: async () => { },
});

// Generate a random user ID
const generateUserId = () => {
    return Math.random().toString(36).substring(2, 15);
};

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState<boolean>(false);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    // Set isClient to true once component mounts on client
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load user ID from localStorage on initial render - only on client
    useEffect(() => {
        if (!isClient) return;

        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        } else {
            const newUserId = generateUserId();
            setUserId(newUserId);
            localStorage.setItem('userId', newUserId);
        }

        // Load participant ID if exists
        const storedParticipantId = localStorage.getItem('participantId');
        if (storedParticipantId) {
            setParticipantId(storedParticipantId);
        }

        // Check if user was in a room
        const storedRoomId = localStorage.getItem('currentRoomId');
        if (storedRoomId) {
            refreshRoom(storedRoomId).catch(console.error);
        }
    }, [isClient]);

    // Set up polling when in a room
    useEffect(() => {
        if (!isClient || !room?.id) return;

        // Clear any existing interval
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }

        // Set up new polling interval
        const intervalId = setInterval(() => {
            refreshRoom(room.id).catch(console.error);
        }, 3000); // Poll every 3 seconds

        setPollingInterval(intervalId);

        // Clean up on unmount or room change
        return () => {
            clearInterval(intervalId);
            setPollingInterval(null);
        };
    }, [isClient, room?.id]);

    // Create a new room
    const createRoom = async (name: string, description: string, hostName: string): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            if (!userId) {
                const newUserId = generateUserId();
                setUserId(newUserId);
                localStorage.setItem('userId', newUserId);
            }

            const newRoom = await api.createRoom(name, description, hostName);

            // Find the host participant (created along with the room)
            const hostParticipant = newRoom.participants.find(p => p.isHost);

            if (hostParticipant) {
                setParticipantId(hostParticipant.id);
                localStorage.setItem('participantId', hostParticipant.id);
            }

            setRoom(newRoom);
            localStorage.setItem('currentRoomId', newRoom.id);

            return newRoom.id;
        } catch (err) {
            console.error('Error creating room:', err);
            setError('Failed to create room');
            return '';
        } finally {
            setIsLoading(false);
        }
    };

    // Join an existing room
    const joinRoom = async (roomId: string, participantName: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await api.joinRoom(roomId, participantName);

            if (!result) {
                setError('Failed to join room');
                return false;
            }

            setRoom(result.room);
            setParticipantId(result.participant.id);

            localStorage.setItem('currentRoomId', roomId);
            localStorage.setItem('participantId', result.participant.id);

            return true;
        } catch (err) {
            console.error('Error joining room:', err);
            setError('Failed to join room');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Leave the current room
    const leaveRoom = async (): Promise<void> => {
        if (!room || !participantId) return;

        setIsLoading(true);
        setError(null);

        try {
            await api.leaveRoom(room.id, participantId);

            setRoom(null);
            setParticipantId(null);

            localStorage.removeItem('currentRoomId');
            localStorage.removeItem('participantId');
        } catch (err) {
            console.error('Error leaving room:', err);
            setError('Failed to leave room');
        } finally {
            setIsLoading(false);
        }
    };

    // Submit a vote
    const submitVote = async (vote: string): Promise<void> => {
        if (!room || !participantId) {
            console.error('Cannot submit vote: room or participantId is missing');
            console.log('Room ID:', room?.id);
            console.log('Participant ID:', participantId);
            setError('Cannot submit vote: not properly connected to room');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log(`Submitting vote ${vote} for participant ${participantId} in room ${room.id}`);
            const updatedRoom = await api.submitVote(room.id, participantId, vote);
            setRoom(updatedRoom);
        } catch (err) {
            console.error('Error submitting vote:', err);
            setError('Failed to submit vote');
        } finally {
            setIsLoading(false);
        }
    };

    // Reveal votes
    const revealVotes = async (): Promise<void> => {
        if (!room) return;

        setIsLoading(true);
        setError(null);

        try {
            const updatedRoom = await api.revealVotes(room.id);
            setRoom(updatedRoom);
        } catch (err) {
            console.error('Error revealing votes:', err);
            setError('Failed to reveal votes');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset votes for a new round
    const resetVotes = async (): Promise<void> => {
        if (!room) return;

        setIsLoading(true);
        setError(null);

        try {
            const updatedRoom = await api.resetVotes(room.id);
            setRoom(updatedRoom);
        } catch (err) {
            console.error('Error resetting votes:', err);
            setError('Failed to reset votes');
        } finally {
            setIsLoading(false);
        }
    };

    // Check if a room exists
    const checkRoomExists = async (roomId: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const exists = await api.checkRoomExists(roomId);
            return exists;
        } catch (err) {
            console.error('Error checking room existence:', err);
            setError('Failed to check if room exists');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh room data
    const refreshRoom = async (roomId: string): Promise<void> => {
        if (!roomId || !isClient) return;

        try {
            const latestRoom = await api.getRoom(roomId);

            if (latestRoom) {
                setRoom(latestRoom);

                // If we have a participantId, verify the participant still exists in the room
                if (participantId) {
                    const participantExists = latestRoom.participants.some(
                        p => p.id === participantId
                    );

                    if (!participantExists) {
                        setParticipantId(null);
                        localStorage.removeItem('participantId');
                    }
                }
            } else {
                // Room no longer exists
                setRoom(null);
                setParticipantId(null);
                localStorage.removeItem('currentRoomId');
                localStorage.removeItem('participantId');
            }
        } catch (err) {
            console.error('Error refreshing room:', err);
            setError('Failed to refresh room data');
        }
    };

    // Context value
    const contextValue = {
        room,
        userId,
        participantId,  // Expose this to components
        isLoading,
        error,
        createRoom,
        joinRoom,
        leaveRoom,
        submitVote,
        revealVotes,
        resetVotes,
        checkRoomExists,
        refreshRoom,
    };

    return (
        <RoomContext.Provider value={contextValue}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => useContext(RoomContext);
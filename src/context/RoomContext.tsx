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
    const [reconnectionAttempt, setReconnectionAttempt] = useState<number>(0);

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
            attemptRoomReconnection(storedRoomId).catch(console.error);
        }
    }, [isClient]);

    // Attempt to reconnect to a room
    const attemptRoomReconnection = async (roomId: string) => {
        if (!isClient) return;

        setIsLoading(true);
        setError(null);

        try {
            // First, check if the room still exists
            const roomExists = await api.checkRoomExists(roomId);
            if (!roomExists) {
                // Clear room data if room no longer exists
                localStorage.removeItem('currentRoomId');
                localStorage.removeItem('participantId');
                setRoom(null);
                setParticipantId(null);
                return;
            }

            // Get the latest room data
            const latestRoom = await api.getRoom(roomId);
            if (!latestRoom) return;

            setRoom(latestRoom);

            // If we have a stored participant ID, check if it's still valid
            const storedParticipantId = localStorage.getItem('participantId');
            const storedParticipantName = localStorage.getItem('participantName');

            if (storedParticipantId) {
                // Check if participant still exists in the room
                const participantExists = latestRoom.participants.some(
                    p => p.id === storedParticipantId
                );

                if (participantExists) {
                    // Participant still exists, we can successfully reconnect
                    setParticipantId(storedParticipantId);
                    return;
                }
            }

            // If we reach here, either participantId was not found or it's not valid anymore
            // But if we have the name, we can try to rejoin with the same name
            if (storedParticipantName) {
                // Check if someone with this name already exists in the room
                const nameExists = latestRoom.participants.some(
                    p => p.name === storedParticipantName
                );

                if (nameExists && reconnectionAttempt < 3) {
                    // Try to rejoin with the same name
                    setReconnectionAttempt(prev => prev + 1);
                    await joinRoom(roomId, storedParticipantName);
                }
            }
        } catch (error) {
            console.error('Error during room reconnection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle beforeunload event to clean up when user closes tab/browser
    useEffect(() => {
        if (!isClient || !room?.id || !participantId) return;

        // Handler for when user is about to leave the page
        const handleBeforeUnload = () => {
            // Store the current state so we can reconnect later
            localStorage.setItem('currentRoomId', room.id);
            localStorage.setItem('participantId', participantId);

            // Note: We're not calling leaveRoom() here anymore to allow reconnection
            // If you want auto-cleanup, you would need to implement a server-side
            // solution that detects inactive sessions
        };

        // Add listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Clean up listener when component unmounts or room/participant changes
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isClient, room?.id, participantId]);

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

            // Store host name in localStorage
            localStorage.setItem('participantName', hostName);

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
            // Store participant name in localStorage
            localStorage.setItem('participantName', participantName);

            // First check if the room already has a participant with the same name
            const existingRoom = await api.getRoom(roomId);
            if (existingRoom) {
                const existingParticipant = existingRoom.participants.find(
                    p => p.name === participantName
                );

                // If a participant with the same name exists, use that instead of creating a new one
                if (existingParticipant) {
                    setRoom(existingRoom);
                    setParticipantId(existingParticipant.id);
                    localStorage.setItem('currentRoomId', roomId);
                    localStorage.setItem('participantId', existingParticipant.id);
                    return true;
                }
            }

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
        if (!room || !participantId) {
            // If we don't have room data but have localStorage data, clean it up
            localStorage.removeItem('currentRoomId');
            localStorage.removeItem('participantId');
            setRoom(null);
            setParticipantId(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const roomId = room.id;
            // Make the API call to leave the room
            await api.leaveRoom(roomId, participantId);

            // Clean up local storage and state
            localStorage.removeItem('currentRoomId');
            localStorage.removeItem('participantId');
            setRoom(null);
            setParticipantId(null);
        } catch (err) {
            console.error('Error leaving room:', err);

            // Even if the API call fails, clean up local state
            // This prevents the user from being stuck
            localStorage.removeItem('currentRoomId');
            localStorage.removeItem('participantId');
            setRoom(null);
            setParticipantId(null);

            setError('Failed to leave room properly');
        } finally {
            setIsLoading(false);
        }
    };

    // Submit a vote
    const submitVote = async (vote: string): Promise<void> => {
        if (!room || !participantId) {
            console.error('Cannot submit vote: room or participantId is missing');
            setError('Cannot submit vote: not properly connected to room');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Ensure neither value is null/undefined before making API call
            if (room.id && participantId) {
                const updatedRoom = await api.submitVote(room.id, participantId, vote);
                setRoom(updatedRoom);
            } else {
                throw new Error('Missing room ID or participant ID for vote submission');
            }
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
                        // Participant no longer exists, but we'll keep the data in local storage
                        // to allow for re-joining with the same name
                        setParticipantId(null);
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
            // Don't set an error here to avoid disrupting the UI during background refreshes
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
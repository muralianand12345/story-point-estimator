"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import { MessageType, ConnectionStatus, webSocketManager, WebSocketManager } from '@/lib/websocket'

// Define types
type Participant = api.Participant;
type Room = api.Room;

interface WebSocketRoomContextType {
    room: Room | null;
    userId: string | null;
    participantId: string | null;
    isLoading: boolean;
    error: string | null;
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
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
const WebSocketRoomContext = createContext<WebSocketRoomContextType>({
    room: null,
    userId: null,
    participantId: null,
    isLoading: false,
    error: null,
    isConnected: false,
    connectionStatus: ConnectionStatus.DISCONNECTED,
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

export const WebSocketRoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState<boolean>(false);
    const [reconnectionAttempt, setReconnectionAttempt] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);

    // Set isClient to true once component mounts on client
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize WebSocket connection
    useEffect(() => {
        if (!isClient || !webSocketManager) return;

        // Set up WebSocket event listeners
        webSocketManager.on('connect', handleConnect);
        webSocketManager.on('disconnect', handleDisconnect);
        webSocketManager.on('reconnecting', handleReconnecting);
        webSocketManager.on('reconnect_failed', handleReconnectFailed);
        webSocketManager.on('error', handleWebSocketError);

        // Set up message listeners
        webSocketManager.on(MessageType.PARTICIPANT_JOINED, handleParticipantJoined);
        webSocketManager.on(MessageType.PARTICIPANT_LEFT, handleParticipantLeft);
        webSocketManager.on(MessageType.ROOM_UPDATED, handleRoomUpdated);
        webSocketManager.on(MessageType.VOTES_REVEALED, handleVotesRevealed);
        webSocketManager.on(MessageType.VOTES_RESET, handleVotesReset);
        webSocketManager.on(MessageType.ERROR, handleError);

        // Connect to WebSocket server
        webSocketManager.connect();

        // Update connection status
        setConnectionStatus(webSocketManager.getStatus());
        setIsConnected(webSocketManager.isConnected());

        // Cleanup event listeners on unmount
        return () => {
            if (webSocketManager) {
                webSocketManager.off('connect', handleConnect);
                webSocketManager.off('disconnect', handleDisconnect);
                webSocketManager.off('reconnecting', handleReconnecting);
                webSocketManager.off('reconnect_failed', handleReconnectFailed);
                webSocketManager.off('error', handleWebSocketError);

                webSocketManager.off(MessageType.PARTICIPANT_JOINED, handleParticipantJoined);
                webSocketManager.off(MessageType.PARTICIPANT_LEFT, handleParticipantLeft);
                webSocketManager.off(MessageType.ROOM_UPDATED, handleRoomUpdated);
                webSocketManager.off(MessageType.VOTES_REVEALED, handleVotesRevealed);
                webSocketManager.off(MessageType.VOTES_RESET, handleVotesReset);
                webSocketManager.off(MessageType.ERROR, handleError);
            }
        };
    }, [isClient]);

    // WebSocket event handlers
    const handleConnect = useCallback(() => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus(ConnectionStatus.CONNECTED);
        setError(null);

        // If we have a stored room and participant ID, attempt to rejoin
        const storedRoomId = localStorage.getItem('currentRoomId');
        const storedParticipantId = localStorage.getItem('participantId');
        const storedParticipantName = localStorage.getItem('participantName');

        if (storedRoomId && storedParticipantName) {
            // Set session info in the WebSocket manager
            if (storedParticipantId) {
                webSocketManager?.setCurrentSession(storedRoomId, storedParticipantId);
            }

            // Refresh room data
            refreshRoom(storedRoomId).catch(console.error);
        }
    }, []);

    const handleDisconnect = useCallback((code: number, reason: string) => {
        console.log(`WebSocket disconnected: ${code} - ${reason}`);
        setIsConnected(false);
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }, []);

    const handleReconnecting = useCallback((attempt: number) => {
        console.log(`WebSocket reconnecting, attempt ${attempt}`);
        setConnectionStatus(ConnectionStatus.RECONNECTING);
        setReconnectionAttempt(attempt);
    }, []);

    const handleReconnectFailed = useCallback(() => {
        console.log('WebSocket reconnect failed');
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        setError('Connection lost. Please refresh the page to reconnect.');
    }, []);

    const handleWebSocketError = useCallback((error: Error) => {
        console.error('WebSocket error:', error);
        setError(`WebSocket error: ${error.message}`);
    }, []);

    // Message handlers
    const handleParticipantJoined = useCallback((payload: any) => {
        console.log('Participant joined:', payload);
        // If this is our own join confirmation, update our participant ID
        if (!participantId && payload.participant) {
            setParticipantId(payload.participant.id);
            localStorage.setItem('participantId', payload.participant.id);

            // If we have a room ID, update the WebSocket manager's session
            const roomId = localStorage.getItem('currentRoomId');
            if (roomId) {
                webSocketManager?.setCurrentSession(roomId, payload.participant.id);
            }
        }
    }, [participantId]);

    const handleParticipantLeft = useCallback((payload: any) => {
        console.log('Participant left:', payload);
    }, []);

    const handleRoomUpdated = useCallback((payload: any) => {
        console.log('Room updated:', payload);
        if (payload.room) {
            setRoom(payload.room);
        }
    }, []);

    const handleVotesRevealed = useCallback((payload: any) => {
        console.log('Votes revealed:', payload);
        if (payload.room) {
            setRoom(payload.room);
        }
    }, []);

    const handleVotesReset = useCallback((payload: any) => {
        console.log('Votes reset:', payload);
        if (payload.room) {
            setRoom(payload.room);
        }
    }, []);

    const handleError = useCallback((payload: any) => {
        console.error('WebSocket error message:', payload);
        setError(payload.message || 'Unknown error');
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

            if (storedParticipantId && webSocketManager && webSocketManager.isConnected()) {
                // Check if participant still exists in the room
                const participantExists = latestRoom.participants.some(
                    p => p.id === storedParticipantId
                );

                if (participantExists) {
                    // Participant still exists, we can successfully reconnect
                    setParticipantId(storedParticipantId);
                    // Update WebSocket session
                    webSocketManager.setCurrentSession(roomId, storedParticipantId);
                    // Join room via WebSocket
                    if (storedParticipantName) {
                        webSocketManager.joinRoom(roomId, storedParticipantName, storedParticipantId);
                    }
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
        if (!isClient || !room?.id || !participantId || !webSocketManager) return;

        // Handler for when user is about to leave the page
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            // Standard message for confirmation dialog
            event.preventDefault();
            event.returnValue = '';

            try {
                // Use WebSocket to leave room if connected
                if (webSocketManager.isConnected()) {
                    webSocketManager.leaveRoom(room.id, participantId);
                } else {
                    // Fall back to XHR if WebSocket is not connected
                    const xhr = new XMLHttpRequest();
                    xhr.open('DELETE', `/api/rooms/${room.id}/participants/${participantId}`, false);
                    xhr.send();
                }

                // Clear local storage
                localStorage.removeItem('participantId');
                localStorage.removeItem('currentRoomId');
                // We keep participantName to make rejoining easier
            } catch (error) {
                console.error('Error during cleanup on page close:', error);
            }
        };

        // Add listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Clean up listener when component unmounts or room/participant changes
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isClient, room?.id, participantId]);

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

            // Create room using REST API (we don't have a WebSocket connection yet)
            const newRoom = await api.createRoom(name, description, hostName);

            // Find the host participant (created along with the room)
            const hostParticipant = newRoom.participants.find(p => p.isHost);

            if (hostParticipant) {
                setParticipantId(hostParticipant.id);
                localStorage.setItem('participantId', hostParticipant.id);

                // If WebSocket is connected, update session and join room
                if (webSocketManager && webSocketManager.isConnected()) {
                    webSocketManager.setCurrentSession(newRoom.id, hostParticipant.id);
                    webSocketManager.joinRoom(newRoom.id, hostName, hostParticipant.id);
                }
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

            // If WebSocket is connected, join through WebSocket
            if (webSocketManager && webSocketManager.isConnected()) {
                // Get the stored participant ID if available
                const storedParticipantId = localStorage.getItem('participantId');

                // Join room via WebSocket
                const joinSuccess = webSocketManager.joinRoom(
                    roomId,
                    participantName,
                    storedParticipantId || undefined
                );

                if (!joinSuccess) {
                    throw new Error('Failed to join room via WebSocket');
                }

                // Get the latest room data
                const latestRoom = await api.getRoom(roomId);
                if (!latestRoom) {
                    throw new Error('Room not found');
                }

                setRoom(latestRoom);
                localStorage.setItem('currentRoomId', roomId);

                // Note: We'll get the participant ID from the server response in the handleParticipantJoined handler

                return true;
            } else {
                // Fall back to REST API if WebSocket is not connected
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
            }
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

            // If WebSocket is connected, leave through WebSocket
            if (webSocketManager && webSocketManager.isConnected()) {
                webSocketManager.leaveRoom(roomId, participantId);
            } else {
                // Fall back to REST API if WebSocket is not connected
                await api.leaveRoom(roomId, participantId);
            }

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
            // If WebSocket is connected, submit vote through WebSocket
            if (webSocketManager && webSocketManager.isConnected()) {
                const success = webSocketManager.submitVote(room.id, participantId, vote);

                if (!success) {
                    throw new Error('Failed to submit vote via WebSocket');
                }

                // The room will be updated via WebSocket message
            } else {
                // Fall back to REST API if WebSocket is not connected
                const updatedRoom = await api.submitVote(room.id, participantId, vote);
                setRoom(updatedRoom);
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
        if (!room || !participantId) return;

        setIsLoading(true);
        setError(null);

        try {
            // If WebSocket is connected, reveal votes through WebSocket
            if (webSocketManager && webSocketManager.isConnected()) {
                const success = webSocketManager.revealVotes(room.id, participantId);

                if (!success) {
                    throw new Error('Failed to reveal votes via WebSocket');
                }

                // The room will be updated via WebSocket message
            } else {
                // Fall back to REST API if WebSocket is not connected
                const updatedRoom = await api.revealVotes(room.id);
                setRoom(updatedRoom);
            }
        } catch (err) {
            console.error('Error revealing votes:', err);
            setError('Failed to reveal votes');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset votes for a new round
    const resetVotes = async (): Promise<void> => {
        if (!room || !participantId) return;

        setIsLoading(true);
        setError(null);

        try {
            // If WebSocket is connected, reset votes through WebSocket
            if (webSocketManager && webSocketManager.isConnected()) {
                const success = webSocketManager.resetVotes(room.id, participantId);

                if (!success) {
                    throw new Error('Failed to reset votes via WebSocket');
                }

                // The room will be updated via WebSocket message
            } else {
                // Fall back to REST API if WebSocket is not connected
                const updatedRoom = await api.resetVotes(room.id);
                setRoom(updatedRoom);
            }
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
        participantId,
        isLoading,
        error,
        isConnected,
        connectionStatus,
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
        <WebSocketRoomContext.Provider value= { contextValue } >
        { children }
        </WebSocketRoomContext.Provider>
  );
};

export const useWebSocketRoom = () => useContext(WebSocketRoomContext);

export default WebSocketRoomContext;
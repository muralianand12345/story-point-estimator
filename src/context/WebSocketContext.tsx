"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { webSocketManager, ConnectionStatus, MessageType } from '@/lib/websocket';
import * as api from '@/lib/api';

interface WebSocketContextType {
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
    connect: () => void;
    disconnect: () => void;
    joinRoom: (roomId: string, participantName: string) => Promise<boolean>;
    leaveRoom: (roomId: string, participantId: string) => Promise<void>;
    submitVote: (roomId: string, participantId: string, vote: string) => boolean;
    revealVotes: (roomId: string, participantId: string) => boolean;
    resetVotes: (roomId: string, participantId: string) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
    isConnected: false,
    connectionStatus: ConnectionStatus.DISCONNECTED,
    connect: () => { },
    disconnect: () => { },
    joinRoom: async () => false,
    leaveRoom: async () => { },
    submitVote: () => false,
    revealVotes: () => false,
    resetVotes: () => false,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (webSocketManager) {
            webSocketManager.connect();
        }
    }, []);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (webSocketManager) {
            webSocketManager.disconnect();
        }
    }, []);

    // Join a room
    const joinRoom = async (roomId: string, participantName: string): Promise<boolean> => {
        try {
            // First join using the REST API to get participantId
            const result = await api.joinRoom(roomId, participantName);

            if (!result) return false;

            // Then connect via WebSocket
            if (webSocketManager && result.participant) {
                return webSocketManager.joinRoom(roomId, participantName, result.participant.id);
            }

            return false;
        } catch (error) {
            console.error('Error joining room via WebSocket:', error);
            return false;
        }
    };

    // Leave a room
    const leaveRoom = async (roomId: string, participantId: string): Promise<void> => {
        try {
            // Leave via the REST API
            await api.leaveRoom(roomId, participantId);

            // Then leave via WebSocket
            if (webSocketManager) {
                webSocketManager.leaveRoom(roomId, participantId);
            }
        } catch (error) {
            console.error('Error leaving room via WebSocket:', error);
        }
    };

    // Submit a vote
    const submitVote = (roomId: string, participantId: string, vote: string): boolean => {
        if (webSocketManager) {
            return webSocketManager.submitVote(roomId, participantId, vote);
        }
        return false;
    };

    // Reveal votes
    const revealVotes = (roomId: string, participantId: string): boolean => {
        if (webSocketManager) {
            return webSocketManager.revealVotes(roomId, participantId);
        }
        return false;
    };

    // Reset votes
    const resetVotes = (roomId: string, participantId: string): boolean => {
        if (webSocketManager) {
            return webSocketManager.resetVotes(roomId, participantId);
        }
        return false;
    };

    // Set up event listeners
    useEffect(() => {
        if (!webSocketManager) return;

        const handleConnect = () => {
            setIsConnected(true);
            setConnectionStatus(ConnectionStatus.CONNECTED);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            setConnectionStatus(ConnectionStatus.DISCONNECTED);
        };

        const handleReconnecting = () => {
            setConnectionStatus(ConnectionStatus.RECONNECTING);
        };

        webSocketManager.on('connect', handleConnect);
        webSocketManager.on('disconnect', handleDisconnect);
        webSocketManager.on('reconnecting', handleReconnecting);

        // Auto-connect on mount
        connect();

        return () => {
            if (!webSocketManager) return;
            webSocketManager.off('connect', handleConnect);
            webSocketManager.off('disconnect', handleDisconnect);
            webSocketManager.off('reconnecting', handleReconnecting);
        };
    }, [connect]);

    const value = {
        isConnected,
        connectionStatus,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        submitVote,
        revealVotes,
        resetVotes,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
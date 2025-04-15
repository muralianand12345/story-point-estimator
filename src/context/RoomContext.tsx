"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateRoomCode } from '../utils/roomUtils';

// Define types
type Participant = {
    id: string;
    name: string;
    vote: string | null;
    isHost: boolean;
};

type Room = {
    id: string;
    name: string;
    description: string;
    participants: Participant[];
    votingOptions: string[];
    isRevealed: boolean;
    createdAt: number;
};

interface RoomContextType {
    room: Room | null;
    userId: string | null;
    createRoom: (name: string, description: string, hostName: string) => string;
    joinRoom: (roomId: string, participantName: string) => boolean;
    leaveRoom: () => void;
    submitVote: (vote: string) => void;
    revealVotes: () => void;
    resetVotes: () => void;
    checkRoomExists: (roomId: string) => boolean;
}

// Create context with default values
const RoomContext = createContext<RoomContextType>({
    room: null,
    userId: null,
    createRoom: () => '',
    joinRoom: () => false,
    leaveRoom: () => { },
    submitVote: () => { },
    revealVotes: () => { },
    resetVotes: () => { },
    checkRoomExists: () => false,
});

// Default voting options based on Fibonacci sequence
const DEFAULT_VOTING_OPTIONS = ['0', '1', '2', '3', '5', '8', '13', '21', '?'];

// Generate a random user ID
const generateUserId = () => {
    return Math.random().toString(36).substring(2, 15);
};

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Load user ID from localStorage on initial render
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        } else {
            const newUserId = generateUserId();
            setUserId(newUserId);
            localStorage.setItem('userId', newUserId);
        }

        // Check if user was in a room
        const storedRoomData = localStorage.getItem('currentRoom');
        if (storedRoomData) {
            setRoom(JSON.parse(storedRoomData));
        }
    }, []);

    // Save room data to localStorage whenever it changes
    useEffect(() => {
        if (room) {
            localStorage.setItem('currentRoom', JSON.stringify(room));
        } else {
            localStorage.removeItem('currentRoom');
        }
    }, [room]);

    // Create a new room
    const createRoom = (name: string, description: string, hostName: string): string => {
        if (!userId) {
            const newUserId = generateUserId();
            setUserId(newUserId);
            localStorage.setItem('userId', newUserId);
        }

        const roomId = generateRoomCode();
        const newRoom: Room = {
            id: roomId,
            name,
            description,
            participants: [
                {
                    id: userId || generateUserId(),
                    name: hostName,
                    vote: null,
                    isHost: true,
                },
            ],
            votingOptions: DEFAULT_VOTING_OPTIONS,
            isRevealed: false,
            createdAt: Date.now(),
        };

        // Save to localStorage
        localStorage.setItem(`room_${roomId}`, JSON.stringify(newRoom));
        setRoom(newRoom);
        return roomId;
    };

    // Join an existing room
    const joinRoom = (roomId: string, participantName: string): boolean => {
        const roomData = localStorage.getItem(`room_${roomId}`);
        if (!roomData) return false;

        const existingRoom: Room = JSON.parse(roomData);

        // Check if this user already exists in the room
        const existingParticipant = existingRoom.participants.find(
            (p) => p.id === userId
        );

        if (existingParticipant) {
            // User is rejoining, update their name if different
            if (existingParticipant.name !== participantName) {
                const updatedParticipants = existingRoom.participants.map(p =>
                    p.id === userId ? { ...p, name: participantName } : p
                );
                const updatedRoom = { ...existingRoom, participants: updatedParticipants };
                localStorage.setItem(`room_${roomId}`, JSON.stringify(updatedRoom));
                setRoom(updatedRoom);
            } else {
                setRoom(existingRoom);
            }
        } else {
            // New participant joining
            const newParticipant: Participant = {
                id: userId || generateUserId(),
                name: participantName,
                vote: null,
                isHost: false,
            };

            const updatedRoom = {
                ...existingRoom,
                participants: [...existingRoom.participants, newParticipant],
            };

            localStorage.setItem(`room_${roomId}`, JSON.stringify(updatedRoom));
            setRoom(updatedRoom);
        }

        return true;
    };

    // Leave the current room
    const leaveRoom = () => {
        if (!room || !userId) return;

        // If user is host, we could handle room deletion differently
        const isHost = room.participants.find(p => p.id === userId)?.isHost;

        if (isHost) {
            // If host leaves, delete the room
            localStorage.removeItem(`room_${room.id}`);
        } else {
            // Just remove the participant
            const updatedParticipants = room.participants.filter(p => p.id !== userId);
            const updatedRoom = { ...room, participants: updatedParticipants };
            localStorage.setItem(`room_${room.id}`, JSON.stringify(updatedRoom));
        }

        setRoom(null);
    };

    // Submit a vote
    const submitVote = (vote: string) => {
        if (!room || !userId) return;

        const updatedParticipants = room.participants.map(participant =>
            participant.id === userId ? { ...participant, vote } : participant
        );

        const updatedRoom = { ...room, participants: updatedParticipants };
        localStorage.setItem(`room_${room.id}`, JSON.stringify(updatedRoom));
        setRoom(updatedRoom);
    };

    // Reveal all votes
    const revealVotes = () => {
        if (!room || !userId) return;

        // Only the host can reveal votes
        const isHost = room.participants.find(p => p.id === userId)?.isHost;
        if (!isHost) return;

        const updatedRoom = { ...room, isRevealed: true };
        localStorage.setItem(`room_${room.id}`, JSON.stringify(updatedRoom));
        setRoom(updatedRoom);
    };

    // Reset votes for a new round
    const resetVotes = () => {
        if (!room || !userId) return;

        // Only the host can reset votes
        const isHost = room.participants.find(p => p.id === userId)?.isHost;
        if (!isHost) return;

        const updatedParticipants = room.participants.map(participant => ({
            ...participant,
            vote: null,
        }));

        const updatedRoom = {
            ...room,
            participants: updatedParticipants,
            isRevealed: false
        };

        localStorage.setItem(`room_${room.id}`, JSON.stringify(updatedRoom));
        setRoom(updatedRoom);
    };

    // Check if a room exists
    const checkRoomExists = (roomId: string): boolean => {
        const roomData = localStorage.getItem(`room_${roomId}`);
        return !!roomData;
    };

    const contextValue = {
        room,
        userId,
        createRoom,
        joinRoom,
        leaveRoom,
        submitVote,
        revealVotes,
        resetVotes,
        checkRoomExists,
    };

    return <RoomContext.Provider value={contextValue}> {children} </RoomContext.Provider>;
};

export const useRoom = () => useContext(RoomContext);
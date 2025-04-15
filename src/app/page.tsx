'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useRoom } from '../context/RoomContext';

export default function Home() {
    const router = useRouter();
    const { createRoom, joinRoom, checkRoomExists } = useRoom();

    const [roomId, setRoomId] = useState('');
    const [name, setName] = useState('');
    const [joinError, setJoinError] = useState('');

    const [roomName, setRoomName] = useState('');
    const [roomDescription, setRoomDescription] = useState('');
    const [hostName, setHostName] = useState('');

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError('');

        if (!name.trim()) {
            setJoinError('Please enter your name');
            return;
        }

        // Format the room ID: trim whitespace and convert to uppercase
        const formattedRoomId = roomId.trim().toUpperCase();

        if (!formattedRoomId) {
            setJoinError('Please enter a room code');
            return;
        }

        // Check if room exists
        if (!checkRoomExists(formattedRoomId)) {
            setJoinError('Room not found. Please check the room code');
            return;
        }

        // Join the room
        const success = joinRoom(formattedRoomId, name.trim());
        if (success) {
            router.push(`/room/${formattedRoomId}`);
        } else {
            setJoinError('Failed to join room. Please try again.');
        }
    };

    const handleCreateRoom = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedRoomName = roomName.trim();
        const trimmedHostName = hostName.trim();

        if (!trimmedRoomName || !trimmedHostName) {
            return;
        }

        const newRoomId = createRoom(trimmedRoomName, roomDescription.trim(), trimmedHostName);
        router.push(`/room/${newRoomId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Story Point Estimator
                    </h1>
                    <p className="text-lg text-gray-600">
                        Simple, real-time story point estimation for agile teams
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Join Room */}
                    <Card>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Join a Room</h2>
                        <form onSubmit={handleJoinRoom}>
                            <Input
                                id="join-room-id"
                                label="Room Code"
                                placeholder="Enter room code"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                required
                            />
                            <Input
                                id="join-name"
                                label="Your Name"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            {joinError && (
                                <p className="text-red-500 text-sm mb-4">{joinError}</p>
                            )}
                            <Button type="submit" fullWidth>
                                Join Room
                            </Button>
                        </form>
                    </Card>

                    {/* Create Room */}
                    <Card>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a Room</h2>
                        <form onSubmit={handleCreateRoom}>
                            <Input
                                id="create-name"
                                label="Your Name"
                                placeholder="Enter your name"
                                value={hostName}
                                onChange={(e) => setHostName(e.target.value)}
                                required
                            />
                            <Input
                                id="room-name"
                                label="Room Name"
                                placeholder="Enter room name"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                required
                            />
                            <Input
                                id="room-description"
                                label="Description (Optional)"
                                placeholder="Enter room description"
                                value={roomDescription}
                                onChange={(e) => setRoomDescription(e.target.value)}
                            />
                            <Button type="submit" fullWidth>
                                Create Room
                            </Button>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    );
}
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Card from '../../../components/Card';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { useRoom } from '../../../context/RoomContext';

export default function JoinPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;

    const { room, joinRoom, checkRoomExists } = useRoom();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [roomExists, setRoomExists] = useState(true);

    // Check if room exists and if user is already in the room
    useEffect(() => {
        if (!roomId) return;

        // If already in this room, redirect to room page
        if (room && room.id === roomId) {
            router.push(`/room/${roomId}`);
            return;
        }

        // Check if room exists
        const exists = checkRoomExists(roomId);
        setRoomExists(exists);
    }, [room, roomId, router, checkRoomExists]);

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name) {
            setError('Please enter your name');
            return;
        }

        if (!roomExists) {
            setError('This room no longer exists');
            return;
        }

        const success = joinRoom(roomId, name);
        if (success) {
            router.push(`/room/${roomId}`);
        } else {
            setError('Failed to join room. Please try again.');
        }
    };

    if (!roomExists) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="max-w-md mx-auto px-4 py-12">
                    <Card>
                        <h1 className="text-xl font-bold text-gray-900 mb-4">Room Not Found</h1>
                        <p className="text-gray-600 mb-6">
                            The room you're trying to join no longer exists or has been closed by the host.
                        </p>
                        <Button onClick={() => router.push('/')} fullWidth>
                            Back to Home
                        </Button>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-md mx-auto px-4 py-12">
                <Card>
                    <h1 className="text-xl font-bold text-gray-900 mb-4">Join Room</h1>
                    <p className="text-gray-600 mb-6">
                        You're joining room: <span className="font-mono font-medium">{roomId}</span>
                    </p>

                    <form onSubmit={handleJoinRoom}>
                        <Input
                            id="participant-name"
                            label="Your Name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            error={error}
                        />

                        <div className="flex space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/')}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                            >
                                Join Room
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}
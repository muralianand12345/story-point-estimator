'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Card from '../../../components/Card';
import Input from '../../../components/Input';
import { useWebSocketRoom } from '../../../context/WebSocketRoomContext';
import Button from '../../../components/Button';
import Logo from '../../../components/Logo';

const JoinPage = () => {
    const params = useParams();
    const router = useRouter();

    // Extract and format room ID
    const roomId = typeof params.id === 'string'
        ? params.id
        : Array.isArray(params.id)
            ? params.id[0]
            : '';
    const formattedRoomId = roomId.trim().toUpperCase();

    const { room, joinRoom, checkRoomExists, refreshRoom, isConnected } = useWebSocketRoom();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [roomExists, setRoomExists] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const initialCheckDone = useRef(false);

    // Set isClient once component mounts
    useEffect(() => {
        setIsClient(true);
        // Try to restore name from localStorage
        const storedName = localStorage.getItem('participantName');
        if (storedName) {
            setName(storedName);
        }
    }, []);

    // Check if room exists and if user is already in the room
    useEffect(() => {
        if (!formattedRoomId || !isClient) return;
        if (initialCheckDone.current) return;

        // If already in this room, redirect to room page
        if (room && room.id === formattedRoomId) {
            router.push(`/room/${formattedRoomId}`);
            return;
        }

        // Check if room exists
        const checkRoom = async () => {
            const exists = await checkRoomExists(formattedRoomId);
            setRoomExists(exists);

            // Only refresh if the room exists
            if (exists) {
                await refreshRoom(formattedRoomId);
            }
        };

        checkRoom();
        initialCheckDone.current = true;
    }, [room, formattedRoomId, router, checkRoomExists, refreshRoom, isClient]);

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!name.trim()) {
            setError('Please enter your name');
            setIsSubmitting(false);
            return;
        }

        if (!roomExists) {
            setError('This room no longer exists');
            setIsSubmitting(false);
            return;
        }

        if (!isConnected) {
            setError('Not connected to server. Please wait for connection or refresh the page.');
            setIsSubmitting(false);
            return;
        }

        try {
            const success = await joinRoom(formattedRoomId, name.trim());
            if (success) {
                router.push(`/room/${formattedRoomId}`);
            } else {
                setError('Failed to join room. Please try again.');
            }
        } catch (error) {
            console.error('Error joining room:', error);
            setError('An error occurred while joining the room.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!roomExists) {
        return (
            <div className="min-h-screen">
                <Header />
                <main className="max-w-md mx-auto px-4 py-12">
                    <Card>
                        <div className="flex justify-center mb-6">
                            <Logo size="md" />
                        </div>
                        <h1 className="text-xl font-bold mb-4 text-primary-700 dark:text-primary-400">Room Not Found</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            The room you&apos;re trying to join no longer exists or has been closed by the host.
                        </p>
                        <Button
                            onClick={() => router.push('/')}
                            variant="primary"
                        >
                            Back to Home
                        </Button>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header />

            <main className="max-w-md mx-auto px-4 py-12">
                <Card>
                    <div className="flex justify-center mb-6">
                        <Logo size="md" />
                    </div>
                    <h1 className="text-xl font-bold mb-4 text-primary-700 dark:text-primary-400">Join Room</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You&apos;re joining room: <span className="font-mono font-medium text-primary-600 dark:text-primary-400">{formattedRoomId}</span>
                    </p>

                    {!isConnected && (
                        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded">
                            <p className="flex items-center text-sm">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Connecting to server... Please wait before joining.
                            </p>
                        </div>
                    )}

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

                        <div className="flex space-x-4 mt-4">
                            <Button
                                type="button"
                                onClick={() => router.push('/')}
                                variant="outline"
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1"
                                disabled={isSubmitting || !isConnected}
                            >
                                {isSubmitting ? 'Joining...' : 'Join Room'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}

export default JoinPage;
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const RoomJoin: React.FC = () => {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState('');
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load username from localStorage if available
    useEffect(() => {
        const savedUserName = localStorage.getItem('userName');
        if (savedUserName) {
            setUserName(savedUserName);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomCode.trim() || !userName.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Generate a user ID or get from localStorage if exists
            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = uuidv4();
                localStorage.setItem('userId', userId);
            }

            // Save username in localStorage
            localStorage.setItem('userName', userName);

            // Join room via API
            const response = await fetch('/api/room/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomCode,
                    userId,
                    userName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join room');
            }

            // Navigate to the room
            router.push(`/room/${data.room.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Join a Room</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Room Code
                    </label>
                    <input
                        type="text"
                        id="roomCode"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter 6-digit room code"
                        disabled={isLoading}
                        required
                        maxLength={6}
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name
                    </label>
                    <input
                        type="text"
                        id="userName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your name"
                        disabled={isLoading}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? 'Joining...' : 'Join Room'}
                </button>
            </form>
        </div>
    );
};

export default RoomJoin;
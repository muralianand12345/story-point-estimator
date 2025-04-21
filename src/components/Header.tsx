'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWebSocketRoom } from '../context/WebSocketRoomContext';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import WebSocketStatus from '../context/WebSocketStatus';

const Header: React.FC = () => {
    const { room, leaveRoom } = useWebSocketRoom();
    const [isClient, setIsClient] = useState(false);

    // Set isClient to true on mount to avoid hydration mismatch
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        // Return a minimal header during SSR to avoid hydration issues
        return (
            <header className="app-header py-4 px-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-primary-600 dark:text-primary-400">
                        <span className="text-xl font-bold">STORY POINTS</span>
                    </Link>
                </div>
            </header>
        );
    }

    return (
        <header className="app-header py-4 px-6">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" aria-label="Go to homepage">
                    <Logo showText={true} size="md" />
                </Link>

                <div className="flex items-center space-x-4">
                    <WebSocketStatus />
                    <ThemeToggle />

                    {room && (
                        <>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Room: <span className="font-mono font-medium">{room.id}</span>
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={leaveRoom}
                            >
                                Leave Room
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
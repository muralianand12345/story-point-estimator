'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRoom } from '../context/RoomContext';
import Button from './Button';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
    const { room, leaveRoom } = useRoom();
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
                    <Link href="/" className="text-xl font-bold text-purple-500">
                        Story Point Estimator
                    </Link>
                </div>
            </header>
        );
    }

    return (
        <header className="app-header py-4 px-6">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-purple-500">
                    Story Point Estimator
                </Link>

                <div className="flex items-center space-x-4">
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
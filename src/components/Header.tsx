import React from 'react';
import Link from 'next/link';
import { useRoom } from '../context/RoomContext';
import Button from './Button';

const Header: React.FC = () => {
    const { room, leaveRoom } = useRoom();

    return (
        <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-indigo-600">
                    Story Point Estimator
                </Link>

                {room && (
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                            Room: <span className="font-mono font-medium">{room.id}</span>
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={leaveRoom}
                        >
                            Leave Room
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
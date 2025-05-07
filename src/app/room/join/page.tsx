'use client';

import React from 'react';
import Link from 'next/link';
import RoomJoin from '@/components/RoomJoin';

const JoinRoomPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto w-full">
                <div className="mb-8">
                    <Link href="/" className="text-blue-500 hover:text-blue-700">
                        &larr; Back to Home
                    </Link>
                </div>

                <RoomJoin />
            </div>
        </div>
    );
};

export default JoinRoomPage;
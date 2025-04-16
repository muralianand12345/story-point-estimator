'use client';

import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';

interface ShareRoomProps {
    roomId: string;
}

const ShareRoom: React.FC<ShareRoomProps> = ({ roomId }) => {
    const [copied, setCopied] = useState(false);
    const [copyType, setCopyType] = useState<'code' | 'link'>('code');
    const [roomLink, setRoomLink] = useState('');
    const [isClient, setIsClient] = useState(false);

    // Set isClient to true on mount to avoid hydration mismatch
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Set room link once we're on the client
    useEffect(() => {
        if (isClient && roomId) {
            setRoomLink(`${window.location.origin}/join/${roomId}`);
        }
    }, [isClient, roomId]);

    const copyToClipboard = (text: string, type: 'code' | 'link') => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setCopied(true);
                    setCopyType(type);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        }
    };

    // Return a placeholder during server-side rendering to avoid hydration issues
    if (!isClient) {
        return (
            <Card className="mb-6">
                <h3 className="text-lg font-medium mb-4">Share Room</h3>
                <div className="mb-4 h-16">
                    {/* Placeholder content with matching height */}
                </div>
            </Card>
        );
    }

    return (
        <Card className="mb-6">
            <h3 className="text-lg font-medium mb-4">Share Room</h3>

            <div className="mb-4">
                <div className="flex items-center mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mr-2">Room Code:</p>
                    <p className="font-mono font-medium text-lg">{roomId}</p>
                </div>

                <div className="flex space-x-2">
                    <button
                        className="btn-primary flex-1"
                        onClick={() => copyToClipboard(roomId, 'code')}
                    >
                        {copied && copyType === 'code' ? 'Copied!' : 'Copy Code'}
                    </button>

                    <button
                        className="btn-primary flex-1"
                        onClick={() => copyToClipboard(roomLink, 'link')}
                    >
                        {copied && copyType === 'link' ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default ShareRoom;
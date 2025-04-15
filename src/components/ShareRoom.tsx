import React, { useState } from 'react';
import Button from './Button';
import Card from './Card';

interface ShareRoomProps {
    roomId: string;
}

const ShareRoom: React.FC<ShareRoomProps> = ({ roomId }) => {
    const [copied, setCopied] = useState(false);

    const roomLink = typeof window !== 'undefined'
        ? `${window.location.origin}/room/${roomId}`
        : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Share Room</h3>

            <div className="mb-4">
                <div className="flex items-center mb-2">
                    <p className="text-sm text-gray-500 mr-2">Room Code:</p>
                    <p className="font-mono font-medium text-lg">{roomId}</p>
                </div>

                <div className="flex space-x-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={copyRoomId}
                    >
                        {copied ? 'Copied!' : 'Copy Code'}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                    >
                        Copy Link
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ShareRoom;
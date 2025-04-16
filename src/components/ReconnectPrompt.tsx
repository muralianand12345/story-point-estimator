'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from './Card';
import Button from './Button';
import Logo from './Logo';

interface ReconnectPromptProps {
    roomId: string;
    onReconnect: () => Promise<boolean>;
    onJoinWithNewName: () => void;
}

const ReconnectPrompt: React.FC<ReconnectPromptProps> = ({
    roomId,
    onReconnect,
    onJoinWithNewName
}) => {
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [error, setError] = useState('');

    const handleReconnect = async () => {
        setIsReconnecting(true);
        setError('');

        try {
            setAttempts(prev => prev + 1);
            const success = await onReconnect();

            if (!success && attempts >= 2) {
                setError('Multiple reconnection attempts failed. You may need to join with a new name.');
            }
        } catch (err) {
            console.error('Reconnection error:', err);
            setError('Failed to reconnect. Please try again or join with a new name.');
        } finally {
            setIsReconnecting(false);
        }
    };

    return (
        <Card>
            <div className="flex justify-center mb-6">
                <Logo size="md" />
            </div>
            <h1 className="text-xl font-bold mb-4 text-primary-700 dark:text-primary-400">Session Disconnected</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your connection to room <span className="font-mono font-medium">{roomId}</span> was lost.
                Would you like to reconnect?
            </p>

            {error && (
                <div className="mb-4 p-3 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded">
                    {error}
                </div>
            )}

            <div className="flex space-x-4">
                <Button
                    onClick={handleReconnect}
                    variant="primary"
                    className="flex-1"
                    disabled={isReconnecting || attempts > 3}
                >
                    {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
                </Button>
                <Button
                    onClick={onJoinWithNewName}
                    variant="outline"
                    className="flex-1"
                    disabled={isReconnecting}
                >
                    Join With New Name
                </Button>
            </div>
        </Card>
    );
};

export default ReconnectPrompt;
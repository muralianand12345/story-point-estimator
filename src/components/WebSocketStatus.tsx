'use client';

import React from 'react';
import { useWebSocketRoom } from '../context/WebSocketRoomContext';
import { ConnectionStatus } from '../context/WebSocketRoomContext';

interface WebSocketStatusProps {
    showLabel?: boolean;
    className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
    showLabel = true,
    className = '',
}) => {
    const { connectionStatus } = useWebSocketRoom();

    // Define status colors and labels
    const getStatusDetails = () => {
        switch (connectionStatus) {
            case ConnectionStatus.CONNECTED:
                return {
                    color: 'bg-green-500',
                    label: 'Connected',
                    pulse: false
                };
            case ConnectionStatus.CONNECTING:
                return {
                    color: 'bg-yellow-500',
                    label: 'Connecting',
                    pulse: true
                };
            case ConnectionStatus.RECONNECTING:
                return {
                    color: 'bg-yellow-500',
                    label: 'Reconnecting',
                    pulse: true
                };
            case ConnectionStatus.DISCONNECTED:
            default:
                return {
                    color: 'bg-red-500',
                    label: 'Disconnected',
                    pulse: false
                };
        }
    };

    const { color, label, pulse } = getStatusDetails();

    return (
        <div className={`flex items-center ${className}`}>
            <div className={`relative w-2 h-2 rounded-full ${color}`}>
                {pulse && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-yellow-400 opacity-75"></span>
                )}
            </div>
            {showLabel && (
                <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {label}
                </span>
            )}
        </div>
    );
};

export default WebSocketStatus;
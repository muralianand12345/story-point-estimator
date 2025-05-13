import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
    onOpen?: (event: WebSocketEventMap['open']) => void;
    onMessage?: (event: WebSocketEventMap['message']) => void;
    onClose?: (event: WebSocketEventMap['close']) => void;
    onError?: (event: WebSocketEventMap['error']) => void;
    reconnectAttempts?: number;
    reconnectInterval?: number;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = options.reconnectAttempts || 5;
    const reconnectInterval = options.reconnectInterval || 3000;

    const connect = useCallback(() => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        websocketRef.current = new WebSocket(url);

        websocketRef.current.onopen = (event) => {
            setIsConnected(true);
            reconnectAttemptsRef.current = 0;
            if (options.onOpen) options.onOpen(event);
        };

        websocketRef.current.onmessage = (event) => {
            setLastMessage(event);
            if (options.onMessage) options.onMessage(event);
        };

        websocketRef.current.onclose = (event) => {
            setIsConnected(false);

            // Only attempt to reconnect if not a normal closure or if specifically requested
            if ((event.code !== 1000 && event.code !== 1001) || options.reconnectAttempts) {
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        reconnectAttemptsRef.current += 1;
                        connect();
                    }, reconnectInterval);
                }
            }

            if (options.onClose) options.onClose(event);
        };

        websocketRef.current.onerror = (event) => {
            if (options.onError) options.onError(event);
        };
    }, [url, options, maxReconnectAttempts, reconnectInterval]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (websocketRef.current) {
            websocketRef.current.close();
        }
    }, []);

    const sendMessage = useCallback((data: any) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
            return true;
        }
        return false;
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        lastMessage,
        sendMessage,
        connect,
        disconnect
    };
};
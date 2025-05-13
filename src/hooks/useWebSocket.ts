import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
    onOpen?: (event: WebSocketEventMap['open']) => void;
    onMessage?: (event: WebSocketEventMap['message']) => void;
    onClose?: (event: WebSocketEventMap['close']) => void;
    onError?: (event: WebSocketEventMap['error']) => void;
    reconnectAttempts?: number;
    reconnectInterval?: number;
    debug?: boolean;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = options.reconnectAttempts || 5;
    const reconnectInterval = options.reconnectInterval || 3000;
    const debug = options.debug || false;

    const connect = useCallback(() => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            if (debug) console.log("WebSocket already connected, skipping connection");
            return;
        }

        if (debug) console.log(`Connecting to WebSocket at: ${url}`);

        try {
            websocketRef.current = new WebSocket(url);

            websocketRef.current.onopen = (event) => {
                if (debug) console.log("WebSocket connection opened");
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
                if (options.onOpen) options.onOpen(event);
            };

            websocketRef.current.onmessage = (event) => {
                if (debug) console.log("WebSocket message received:", event.data);
                setLastMessage(event);
                if (options.onMessage) options.onMessage(event);
            };

            websocketRef.current.onclose = (event) => {
                if (debug) console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
                setIsConnected(false);

                // Only attempt to reconnect if not a normal closure or if specifically requested
                if ((event.code !== 1000 && event.code !== 1001) || options.reconnectAttempts) {
                    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                        if (debug) console.log(`Attempting to reconnect (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);
                        reconnectTimeoutRef.current = window.setTimeout(() => {
                            reconnectAttemptsRef.current += 1;
                            connect();
                        }, reconnectInterval);
                    } else {
                        if (debug) console.log("Max reconnect attempts reached, giving up");
                    }
                }

                if (options.onClose) options.onClose(event);
            };

            websocketRef.current.onerror = (event) => {
                if (debug) console.error("WebSocket error:", event);
                if (options.onError) options.onError(event);
            };
        } catch (error) {
            console.error("Error creating WebSocket:", error);
        }
    }, [url, options, maxReconnectAttempts, reconnectInterval, debug]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (websocketRef.current) {
            if (debug) console.log("Manually disconnecting WebSocket");
            websocketRef.current.close();
        }
    }, [debug]);

    const sendMessage = useCallback((data: any) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            if (debug) console.log("Sending WebSocket message:", message);
            websocketRef.current.send(message);
            return true;
        }
        if (debug) console.warn("Cannot send message, WebSocket is not connected");
        return false;
    }, [debug]);

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
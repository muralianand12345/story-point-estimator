import { SocketEvent } from '@/types';

type MessageHandler = (data: any) => void;

// Class to manage WebSocket connections
export class SocketService {
    private static instance: SocketService;
    private socket: WebSocket | null = null;
    private roomId: string | null = null;
    private userId: string | null = null;
    private eventHandlers: Map<string, Set<MessageHandler>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isClosingIntentionally = false;

    private constructor() { }

    // Singleton pattern to ensure only one socket connection
    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    // Connect to the WebSocket server
    public connect(roomId: string, userId: string): WebSocket {
        this.roomId = roomId;
        this.userId = userId;
        this.isClosingIntentionally = false;

        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/api/websocket?roomId=${roomId}&userId=${userId}`;

            console.log(`Connecting to WebSocket at ${wsUrl}`);
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
        }

        return this.socket;
    }

    private handleOpen(event: Event) {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.triggerEvent('connect', null);
    }

    private handleMessage(event: MessageEvent) {
        try {
            const { event: eventName, data } = JSON.parse(event.data);

            // Special case for initialization message
            if (eventName === 'initialize') {
                // Handle each piece of initialization data separately
                const { votes, isRevealed, currentIssue } = data;

                if (votes) this.triggerEvent(SocketEvent.VOTES_UPDATED, votes);
                if (isRevealed !== undefined) this.triggerEvent(SocketEvent.REVEAL_VOTES, isRevealed);
                if (currentIssue) this.triggerEvent(SocketEvent.ISSUE_UPDATED, currentIssue);

                return;
            }

            // Normal event handling
            this.triggerEvent(eventName, data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    private handleClose(event: CloseEvent) {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);

        // Don't attempt to reconnect if we closed intentionally or the max attempts are reached
        if (!this.isClosingIntentionally && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
        } else {
            this.triggerEvent('disconnect', { code: event.code, reason: event.reason });
        }
    }

    private handleError(event: Event) {
        console.error('WebSocket error:', event);
        this.triggerEvent('error', event);
    }

    private attemptReconnect() {
        this.reconnectAttempts++;

        // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, etc.) capped at 30s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Set up new reconnect timeout
        this.reconnectTimeout = setTimeout(() => {
            if (this.roomId && this.userId) {
                this.connect(this.roomId, this.userId);
            }
        }, delay);
    }

    // Register an event handler
    public on(event: string, handler: MessageHandler): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }

        this.eventHandlers.get(event)?.add(handler);
    }

    // Remove an event handler
    public off(event: string, handler: MessageHandler): void {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event)?.delete(handler);

            // Clean up empty handler sets
            if (this.eventHandlers.get(event)?.size === 0) {
                this.eventHandlers.delete(event);
            }
        }
    }

    // Remove all event handlers for an event
    public removeAllListeners(event: string): void {
        this.eventHandlers.delete(event);
    }

    // Trigger an event with data
    private triggerEvent(event: string, data: any): void {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event)?.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in handler for event "${event}":`, error);
                }
            });
        }
    }

    // Disconnect the socket
    public disconnect(): void {
        this.isClosingIntentionally = true;

        if (this.socket) {
            // Only close if it's not already closed
            if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
                this.socket.close(1000, 'Client disconnected');
            }
            this.socket = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.roomId = null;
        this.userId = null;
        this.eventHandlers.clear();
        this.reconnectAttempts = 0;
    }

    // Check if socket is connected
    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    // Send a message to the server
    private send(event: string, data: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify({ event, data }));
            } catch (error) {
                console.error(`Error sending WebSocket message (${event}):`, error);
            }
        } else {
            console.warn(`Cannot send message (${event}), socket not connected`);
            // Could queue messages here to send when reconnected
        }
    }

    // API methods
    public kickUser(userId: string): void {
        this.send(SocketEvent.KICK_USER, userId);
    }

    public leaveRoom(): void {
        this.send(SocketEvent.LEAVE_ROOM, null);
        this.disconnect();
    }

    public submitVote(value: number | null): void {
        this.send(SocketEvent.SUBMIT_VOTE, value);
    }

    public revealVotes(reveal: boolean): void {
        this.send(SocketEvent.REVEAL_VOTES, reveal);
    }

    public resetVotes(): void {
        this.send(SocketEvent.RESET_VOTES, null);
    }

    public updateIssue(issue: string): void {
        this.send(SocketEvent.ISSUE_UPDATED, issue);
    }

    // Get the socket instance (primarily for debugging)
    public getSocket(): WebSocket | null {
        return this.socket;
    }
}

export default SocketService.getInstance();
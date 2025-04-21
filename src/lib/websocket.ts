export { ConnectionStatus, MessageType } from '../types/websocket';
import { WebSocketMessage, WebSocketMessageUnion, WebSocketEventMap, ConnectionStatus, MessageType } from '../types/websocket';
import { Room, Participant } from './api';

/**
 * WebSocketManager is responsible for managing WebSocket connections
 * and communication for real-time updates in the Story Points application.
 */
export class WebSocketManager {
    private socket: WebSocket | null = null;
    private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private url: string;
    private eventListeners: Map<string, Array<(...args: any[]) => void>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 2000; // Start with 2 seconds
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatTimeout: NodeJS.Timeout | null = null;
    private lastMessageTime: number = 0;
    private roomId: string | null = null;
    private participantId: string | null = null;

    /**
     * Create a new WebSocketManager
     * @param url The WebSocket server URL
     */
    constructor(url?: string) {
        // Default to the current host with /api/ws path
        this.url = url || this.getDefaultWebSocketUrl();
    }

    /**
     * Get the default WebSocket URL based on the current window location
     */
    private getDefaultWebSocketUrl(): string {
        if (typeof window === 'undefined') return '';

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/api/ws`;
    }

    /**
     * Connect to the WebSocket server
     */
    public connect(): void {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            console.log('WebSocket already connected or connecting.');
            return;
        }

        this.status = ConnectionStatus.CONNECTING;
        this.emit('connecting');

        try {
            // Create a new WebSocket connection with a timeout
            this.socket = new WebSocket(this.url);

            // Set a connection timeout (browsers don't have a built-in timeout for WebSocket connections)
            const connectionTimeout = setTimeout(() => {
                if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
                    console.warn('WebSocket connection timed out');

                    // Force close and cleanup
                    try {
                        this.socket.close(1000, 'Connection timeout');
                    } catch (e) {
                        // Ignore errors on close
                    }

                    this.socket = null;
                    this.status = ConnectionStatus.DISCONNECTED;
                    this.emit('error', new Error('WebSocket connection timeout'));
                    this.scheduleReconnect();
                }
            }, 10000); // 10 second timeout

            // Set up event handlers
            this.socket.onopen = () => {
                clearTimeout(connectionTimeout);
                this.handleOpen();
            };
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.status = ConnectionStatus.DISCONNECTED;
            this.emit('error', new Error(`Failed to create WebSocket connection: ${error instanceof Error ? error.message : String(error)}`));
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket open event
     */
    private handleOpen(): void {
        console.log('WebSocket connection established');
        this.status = ConnectionStatus.CONNECTED;
        this.reconnectAttempts = 0;
        this.lastMessageTime = Date.now();
        this.startHeartbeat();
        this.emit('connect');

        // Rejoin room if we were in one
        this.rejoinRoomIfNeeded();
    }

    /**
     * Start the heartbeat mechanism to keep the connection alive
     */
    private startHeartbeat(): void {
        // Clear any existing heartbeat
        this.stopHeartbeat();

        // Send a heartbeat every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 30000);

        // Check if we're still receiving messages every 45 seconds
        this.heartbeatTimeout = setInterval(() => {
            const now = Date.now();
            // If no message received in 45 seconds, reconnect
            if (now - this.lastMessageTime > 45000) {
                console.warn('No heartbeat received recently, reconnecting...');
                this.reconnect();
            }
        }, 45000);
    }

    /**
     * Stop the heartbeat mechanism
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.heartbeatTimeout) {
            clearInterval(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    /**
     * Send a heartbeat message to the server
     */
    private sendHeartbeat(): void {
        if (this.isConnected() && this.roomId && this.participantId) {
            this.send({
                type: MessageType.HEARTBEAT,
                payload: {
                    roomId: this.roomId,
                    participantId: this.participantId
                }
            });
        }
    }

    /**
     * Attempt to rejoin the room if we were in one before disconnecting
     */
    private rejoinRoomIfNeeded(): void {
        if (this.roomId && this.participantId && typeof window !== 'undefined') {
            const name = localStorage.getItem('participantName');
            if (name) {
                this.joinRoom(this.roomId, name, this.participantId);
            }
        }
    }

    /**
     * Handle WebSocket message event
     */
    private handleMessage(event: MessageEvent): void {
        this.lastMessageTime = Date.now();

        try {
            const message = JSON.parse(event.data) as WebSocketMessageUnion;

            // Handle heartbeat acknowledgement
            if (message.type === MessageType.HEARTBEAT_ACK) {
                // No need to do anything special for heartbeat acks
                return;
            }

            console.log('WebSocket message received:', message.type);

            // Emit the message for listeners
            this.emit('message', message);

            // Also emit an event specific to this message type
            this.emit(message.type, message.payload);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket close event
     */
    private handleClose(event: CloseEvent): void {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.status = ConnectionStatus.DISCONNECTED;
        this.stopHeartbeat();
        this.emit('disconnect', event.code, event.reason);

        // Attempt to reconnect if not closed cleanly
        if (event.code !== 1000 && event.code !== 1001) {
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket error event
     */
    private handleError(event: Event): void {
        // Attempt to get detailed error information
        let errorDetails = 'Unknown error';

        try {
            // Extract useful properties from the event object
            const eventProps = Object.getOwnPropertyNames(event)
                .filter(prop => prop !== 'isTrusted' && prop !== 'currentTarget' && prop !== 'target')
                .reduce((acc, prop) => {
                    try {
                        // @ts-ignore - Dynamically accessing properties
                        acc[prop] = event[prop];
                    } catch (e) {
                        // Some properties might throw when accessed
                    }
                    return acc;
                }, {} as Record<string, any>);

            errorDetails = JSON.stringify(eventProps);
        } catch (e) {
            errorDetails = 'Error details could not be extracted';
        }

        // Log the error with any available details
        console.error(`WebSocket error occurred: ${errorDetails}`);

        // Close the existing socket if it's in a bad state
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            try {
                // Attempt a clean close with code 1006 (Abnormal Closure)
                this.socket.close(1006, 'Error occurred');
            } catch (closeError) {
                console.error('Error while closing socket:', closeError);
            }
        }

        // Reset the socket to null to force a new connection on reconnect
        this.socket = null;

        // Update status and stop heartbeat
        this.status = ConnectionStatus.DISCONNECTED;
        this.stopHeartbeat();

        // Emit the error event with a meaningful message
        this.emit('error', new Error(`WebSocket connection error: ${errorDetails}`));

        // Schedule a reconnection attempt
        this.scheduleReconnect();
    }

    /**
     * Schedule a reconnection attempt
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Maximum reconnection attempts reached');
            this.emit('reconnect_failed');
            return;
        }

        this.status = ConnectionStatus.RECONNECTING;
        this.reconnectAttempts++;

        // Exponential backoff with jitter
        const delay = Math.min(30000, this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1))
            * (0.9 + Math.random() * 0.2);

        console.log(`Scheduling reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);

        this.emit('reconnecting', this.reconnectAttempts);

        this.reconnectTimer = setTimeout(() => {
            this.reconnect();
        }, delay);
    }

    /**
     * Attempt to reconnect to the WebSocket server
     */
    private reconnect(): void {
        if (this.socket) {
            try {
                this.socket.close();
            } catch (error) {
                console.error('Error closing socket before reconnect:', error);
            }
            this.socket = null;
        }

        this.connect();
    }

    /**
     * Close the WebSocket connection
     */
    public disconnect(): void {
        this.stopHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.socket) {
            try {
                this.socket.close(1000, 'Client disconnected');
            } catch (error) {
                console.error('Error closing WebSocket connection:', error);
            }
            this.socket = null;
        }

        this.status = ConnectionStatus.DISCONNECTED;
    }

    /**
     * Send a message to the WebSocket server
     */
    public send(message: WebSocketMessage): boolean {
        if (!this.isConnected()) {
            console.warn('Cannot send message, WebSocket not connected');
            return false;
        }

        try {
            this.socket!.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            return false;
        }
    }

    /**
     * Check if the WebSocket is currently connected
     */
    public isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Get the current connection status
     */
    public getStatus(): ConnectionStatus {
        return this.status;
    }

    /**
     * Add an event listener
     */
    public on<K extends keyof WebSocketEventMap>(event: K, callback: WebSocketEventMap[K]): void {
        if (!this.eventListeners.has(event as string)) {
            this.eventListeners.set(event as string, []);
        }

        this.eventListeners.get(event as string)!.push(callback as any);
    }

    /**
     * Remove an event listener
     */
    public off<K extends keyof WebSocketEventMap>(event: K, callback: WebSocketEventMap[K]): void {
        if (!this.eventListeners.has(event as string)) {
            return;
        }

        const listeners = this.eventListeners.get(event as string)!;
        const index = listeners.indexOf(callback as any);

        if (index !== -1) {
            listeners.splice(index, 1);
        }

        if (listeners.length === 0) {
            this.eventListeners.delete(event as string);
        }
    }

    /**
     * Emit an event to all listeners
     */
    private emit(event: string, ...args: any[]): void {
        if (!this.eventListeners.has(event)) {
            return;
        }

        const listeners = this.eventListeners.get(event)!;

        for (const listener of listeners) {
            try {
                listener(...args);
            } catch (error) {
                console.error(`Error in ${event} event listener:`, error);
            }
        }
    }

    /**
     * Join a room
     */
    public joinRoom(roomId: string, name: string, participantId?: string): boolean {
        this.roomId = roomId;
        if (participantId) {
            this.participantId = participantId;
        }

        return this.send({
            type: MessageType.JOIN_ROOM,
            payload: {
                roomId,
                name,
                participantId
            }
        });
    }

    /**
     * Leave a room
     */
    public leaveRoom(roomId: string, participantId: string): boolean {
        const result = this.send({
            type: MessageType.LEAVE_ROOM,
            payload: {
                roomId,
                participantId
            }
        });

        if (result) {
            this.roomId = null;
            this.participantId = null;
        }

        return result;
    }

    /**
     * Submit a vote
     */
    public submitVote(roomId: string, participantId: string, vote: string): boolean {
        return this.send({
            type: MessageType.SUBMIT_VOTE,
            payload: {
                roomId,
                participantId,
                vote
            }
        });
    }

    /**
     * Reveal votes (host only)
     */
    public revealVotes(roomId: string, participantId: string): boolean {
        return this.send({
            type: MessageType.REVEAL_VOTES,
            payload: {
                roomId,
                participantId
            }
        });
    }

    /**
     * Reset votes (host only)
     */
    public resetVotes(roomId: string, participantId: string): boolean {
        return this.send({
            type: MessageType.RESET_VOTES,
            payload: {
                roomId,
                participantId
            }
        });
    }

    /**
     * Set the current participant and room IDs
     */
    public setCurrentSession(roomId: string, participantId: string): void {
        this.roomId = roomId;
        this.participantId = participantId;
    }

    /**
     * Get the current participant ID
     */
    public getCurrentParticipantId(): string | null {
        return this.participantId;
    }

    /**
     * Get the current room ID
     */
    public getCurrentRoomId(): string | null {
        return this.roomId;
    }
}

// Create a singleton instance
export const webSocketManager = typeof window !== 'undefined'
    ? new WebSocketManager()
    : null;

export default webSocketManager;
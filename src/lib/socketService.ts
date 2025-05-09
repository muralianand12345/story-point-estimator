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

        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/api/socket?roomId=${roomId}&userId=${userId}`;

            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
        }

        return this.socket;
    }

    private handleOpen() {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
    }

    private handleMessage(event: MessageEvent) {
        try {
            const { event: eventName, data } = JSON.parse(event.data);
            this.triggerEvent(eventName, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    private handleClose(event: CloseEvent) {
        console.log('WebSocket connection closed:', event.code, event.reason);

        // Try to reconnect if not manually closed
        if (event.code !== 1000) {
            this.attemptReconnect();
        }
    }

    private handleError(error: Event) {
        console.error('WebSocket error:', error);
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

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
        }
    }

    // Trigger an event with data
    private triggerEvent(event: string, data: any): void {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event)?.forEach(handler => handler(data));
        }
    }

    // Disconnect the socket
    public disconnect(): void {
        if (this.socket) {
            this.socket.close(1000, 'Client disconnected');
            this.socket = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.eventHandlers.clear();
    }

    // Check if socket is connected
    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    // Send a message to the server
    private send(event: string, data: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ event, data }));
        } else {
            console.error('Cannot send message, socket not connected');
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

    // Get the socket instance
    public getSocket(): WebSocket | null {
        return this.socket;
    }
}

export default SocketService.getInstance();
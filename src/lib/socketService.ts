import { SocketEvent } from '@/types';

// Class to manage WebSocket connections with the Deno backend
export class SocketService {
    private static instance: SocketService;
    private socket: WebSocket | null = null;
    private eventListeners: Map<string, Array<(data: any) => void>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private url: string = '';
    private roomId: string = '';
    private userId: string = '';

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
        // Check if we need to reconnect due to different room/user
        if (this.socket && this.socket.readyState === WebSocket.OPEN &&
            (this.roomId !== roomId || this.userId !== userId)) {
            console.log('Reconnecting with new room/user parameters');
            this.disconnect();
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.roomId = roomId;
            this.userId = userId;

            // Get the WebSocket URL from environment variables
            this.url = process.env.NEXT_PUBLIC_DENO_WS_URL || '';
            if (!this.url || this.url === '') {
                throw new Error('WebSocket URL is not defined in environment variables');
            }

            console.log(`Connecting WebSocket for room ${roomId}, user ${userId}`);

            this.socket = new WebSocket(this.url);

            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
        }

        return this.socket;
    }

    private handleOpen(event: Event) {
        console.log('WebSocket connected successfully');

        // Send initialization message with userId and roomId
        this.send({
            event: 'init',
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        });

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
    }

    private handleMessage(event: MessageEvent) {
        try {
            const data = JSON.parse(event.data);
            const { event: eventName, payload } = data;

            console.log(`Received event: ${eventName}`, payload);

            // Dispatch event to all registered listeners
            if (this.eventListeners.has(eventName)) {
                this.eventListeners.get(eventName)?.forEach(callback => {
                    try {
                        callback(payload);
                    } catch (error) {
                        console.error(`Error in event listener for ${eventName}:`, error);
                    }
                });
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    private handleClose(event: CloseEvent) {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);

        // Socket reference should be cleared
        this.socket = null;

        // Attempt to reconnect if not closed intentionally
        if (event.code !== 1000) {
            this.attemptReconnect();
        }
    }

    private handleError(event: Event) {
        console.error('WebSocket error:', event);

        // Close the socket and attempt to reconnect
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.attemptReconnect();
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                if (this.roomId && this.userId) {
                    this.connect(this.roomId, this.userId);
                }
            }, delay);
        } else {
            console.error('Maximum reconnect attempts reached. WebSocket connection failed.');
        }
    }

    // Add an event listener
    public on(event: string, callback: (data: any) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }

        const listeners = this.eventListeners.get(event);
        // Only add if the callback isn't already registered
        if (listeners && !listeners.includes(callback)) {
            listeners.push(callback);
        }
    }

    public off(event: string, callback?: (data: any) => void): void {
        if (!callback) {
            // Remove all listeners for this event
            this.eventListeners.delete(event);
        } else if (this.eventListeners.has(event)) {
            // Remove specific listener for this event
            const listeners = this.eventListeners.get(event) || [];
            this.eventListeners.set(
                event,
                listeners.filter(cb => cb !== callback)
            );
        }
    }

    // Send a message to the WebSocket server
    private send(data: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('WebSocket not connected, cannot send message');
        }
    }

    // Disconnect the WebSocket
    public disconnect(): void {
        if (this.socket) {
            // Remove all event listeners before disconnecting
            this.eventListeners.clear();

            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.close(1000, 'Client disconnected intentionally');
            }

            this.socket = null;
            console.log('WebSocket disconnected');
        }
    }

    // Get the WebSocket instance
    public getSocket(): WebSocket | null {
        return this.socket;
    }

    // Check if WebSocket is connected
    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    // Emit a kick user event
    public kickUser(userId: string): void {
        this.send({
            event: SocketEvent.KICK_USER,
            userId: this.userId,
            roomId: this.roomId,
            payload: userId
        });
    }

    // Emit a leave room event
    public leaveRoom(): void {
        this.send({
            event: SocketEvent.LEAVE_ROOM,
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        });
        this.disconnect();
    }

    // Submit a vote
    public submitVote(value: number | null): void {
        this.send({
            event: SocketEvent.SUBMIT_VOTE,
            userId: this.userId,
            roomId: this.roomId,
            payload: value
        });
    }

    // Reveal votes
    public revealVotes(reveal: boolean): void {
        this.send({
            event: SocketEvent.REVEAL_VOTES,
            userId: this.userId,
            roomId: this.roomId,
            payload: reveal
        });
    }

    // Reset votes
    public resetVotes(): void {
        this.send({
            event: SocketEvent.RESET_VOTES,
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        });
    }

    // Update the current issue
    public updateIssue(issue: string): void {
        this.send({
            event: SocketEvent.ISSUE_UPDATED,
            userId: this.userId,
            roomId: this.roomId,
            payload: issue
        });
    }
}

export default SocketService.getInstance();
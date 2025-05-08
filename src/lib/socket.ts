import { MessageType, WebSocketMessage } from './types';

export class SocketClient {
    private socket: WebSocket | null = null;
    private messageHandlers: Map<MessageType, ((payload: any) => void)[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 3000; // ms

    constructor(private url: string = '') {
        if (typeof window !== 'undefined' && !this.url) {
            // Use the same port as the main application
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            // Connect directly to the WebSocket endpoint, not the API route
            this.url = `${protocol}//${host}/ws`;
        }
    }

    // Connect to WebSocket server
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                // We're on the server side
                reject(new Error('WebSocket client can only be used in the browser'));
                return;
            }

            if (this.socket?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                resolve();
            };

            this.socket.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.socket.onclose = (event) => {
                console.log(`WebSocket closed: ${event.code} ${event.reason}`);
                this.handleReconnect();
            };
        });
    }

    // Disconnect from WebSocket server
    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    // Send message to WebSocket server
    send(type: MessageType, payload: any): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            this.connect()
                .then(() => this.send(type, payload))
                .catch((error) => console.error('Failed to connect:', error));
            return;
        }

        const message: WebSocketMessage = { type, payload };
        this.socket.send(JSON.stringify(message));
    }

    // Register handler for a specific message type
    on(type: MessageType, handler: (payload: any) => void): void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type)!.push(handler);
    }

    // Remove handler for a specific message type
    off(type: MessageType, handler: (payload: any) => void): void {
        if (!this.messageHandlers.has(type)) return;

        const handlers = this.messageHandlers.get(type)!;
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    // Handle incoming messages
    private handleMessage(message: WebSocketMessage): void {
        const { type, payload } = message;
        const handlers = this.messageHandlers.get(type);

        if (handlers) {
            handlers.forEach(handler => handler(payload));
        }
    }

    // Handle reconnection on connection loss
    private handleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Maximum reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, this.reconnectInterval);
    }

    // Join a room
    joinRoom(roomId: string, userId: string, userName: string): void {
        this.send(MessageType.JOIN_ROOM, { roomId, userId, userName });
    }

    // Leave a room
    leaveRoom(): void {
        this.send(MessageType.LEAVE_ROOM, {});
    }

    // Create a new story
    createStory(roomId: string, title: string, description?: string): void {
        this.send(MessageType.CREATE_STORY, { roomId, title, description });
    }

    // Vote on a story
    vote(roomId: string, storyId: string, userId: string, value: string): void {
        this.send(MessageType.VOTE, { roomId, storyId, userId, value });
    }

    // Reveal votes for a story
    revealVotes(roomId: string, storyId: string): void {
        this.send(MessageType.REVEAL_VOTES, { roomId, storyId });
    }

    // Reset votes for a story
    resetVotes(roomId: string, storyId: string): void {
        this.send(MessageType.RESET_VOTES, { roomId, storyId });
    }

    // Move to the next story
    nextStory(roomId: string, currentStoryId: string): void {
        this.send(MessageType.NEXT_STORY, { roomId, currentStoryId });
    }
}

// Create a singleton instance for the app
export const socketClient = typeof window !== 'undefined' ? new SocketClient() : null;

export default socketClient;
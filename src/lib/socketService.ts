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
    private pingInterval: NodeJS.Timeout | null = null;
    private messageQueue: Array<{ event: string, userId: string, roomId: string, payload: any }> = [];
    private queueProcessor: NodeJS.Timeout | null = null;

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

            try {
                this.socket = new WebSocket(this.url);

                this.socket.onopen = this.handleOpen.bind(this);
                this.socket.onmessage = this.handleMessage.bind(this);
                this.socket.onclose = this.handleClose.bind(this);
                this.socket.onerror = this.handleError.bind(this);

                // Start queue processor if it's not running
                this.startQueueProcessor();
            } catch (error) {
                console.error("Error creating WebSocket:", error);
            }
        }

        if (!this.socket) {
            throw new Error('WebSocket connection failed to initialize');
        }
        return this.socket;
    }

    private handleOpen(event: Event) {
        console.log('WebSocket connected successfully');

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;

        // Send initialization message with userId and roomId
        this.send({
            event: 'init',
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        });

        // Add a ping interval to keep connection alive
        this.startPingInterval();

        // Process any queued messages
        this.processQueue();
    }

    private startPingInterval() {
        // Clear any existing interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        // Set up a new ping interval (every 30 seconds)
        this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                console.log('Sending ping to keep connection alive');
                this.send({
                    event: 'ping',
                    userId: this.userId,
                    roomId: this.roomId,
                    payload: null
                });
            }
        }, 30000);
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

        // Clear ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

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

    // Remove event listener(s)
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

    // Queue a message for sending when connection is ready
    private queueMessage(data: any): void {
        console.log('Queueing message for later delivery:', data);
        this.messageQueue.push(data);

        // Ensure the queue processor is running
        this.startQueueProcessor();
    }

    // Process the message queue
    private processQueue(): void {
        if (this.messageQueue.length === 0) return;

        console.log(`Processing ${this.messageQueue.length} queued messages`);

        // Only process if socket is connected
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // Create a copy of the queue and clear it
            const queueToProcess = [...this.messageQueue];
            this.messageQueue = [];

            // Send each message
            queueToProcess.forEach(message => {
                try {
                    this.send(message);
                    console.log('Sent queued message:', message);
                } catch (error) {
                    console.error('Error sending queued message:', error);
                    // Put failed messages back in the queue
                    this.messageQueue.push(message);
                }
            });
        }
    }

    // Start queue processor timer
    private startQueueProcessor(): void {
        if (this.queueProcessor) return;

        this.queueProcessor = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                this.processQueue();
            }

            // Stop processor if queue is empty
            if (this.messageQueue.length === 0 && this.queueProcessor) {
                clearInterval(this.queueProcessor);
                this.queueProcessor = null;
            }
        }, 1000);
    }

    // Send a message to the WebSocket server with improved error handling
    private send(data: any): boolean {
        if (!this.socket) {
            console.error("Cannot send message: Socket is null");
            this.queueMessage(data);
            return false;
        }

        if (this.socket.readyState !== WebSocket.OPEN) {
            console.error(`Cannot send message: Socket not open (state: ${this.socket.readyState})`);
            this.queueMessage(data);
            return false;
        }

        try {
            const message = JSON.stringify(data);
            this.socket.send(message);
            console.log(`Message sent (${message.length} bytes)`);
            return true;
        } catch (error) {
            console.error("Error stringifying or sending message:", error);
            return false;
        }
    }

    // Disconnect the WebSocket
    public disconnect(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        if (this.queueProcessor) {
            clearInterval(this.queueProcessor);
            this.queueProcessor = null;
        }

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
        const message = {
            event: SocketEvent.KICK_USER,
            userId: this.userId,
            roomId: this.roomId,
            payload: userId
        };

        if (!this.send(message)) {
            console.error("Failed to send kick user message, queueing");
        }
    }

    // Emit a leave room event
    public leaveRoom(): void {
        const message = {
            event: SocketEvent.LEAVE_ROOM,
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        };

        if (this.isConnected()) {
            this.send(message);
        }

        // Always disconnect even if sending fails
        this.disconnect();
    }

    // Submit a vote with improved error handling
    public submitVote(value: number | null): void {
        console.log(`Submitting vote to server: ${value}`);

        const voteMessage = {
            event: SocketEvent.SUBMIT_VOTE,
            userId: this.userId,
            roomId: this.roomId,
            payload: value
        };

        // Log the exact message being sent
        console.log("Sending vote message:", JSON.stringify(voteMessage));

        // Send the message or queue if failed
        if (!this.send(voteMessage)) {
            console.error("Failed to send vote message immediately, queued for retry");
        } else {
            console.log("Vote message sent successfully");
        }
    }

    // Reveal votes with improved handling
    public revealVotes(reveal: boolean): void {
        const message = {
            event: SocketEvent.REVEAL_VOTES,
            userId: this.userId,
            roomId: this.roomId,
            payload: reveal
        };

        if (!this.send(message)) {
            console.error("Failed to send reveal votes message, queueing");
        }
    }

    // Reset votes with improved handling
    public resetVotes(): void {
        const message = {
            event: SocketEvent.RESET_VOTES,
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        };

        if (!this.send(message)) {
            console.error("Failed to send reset votes message, queueing");
        }
    }

    // Update the current issue with improved error handling
    public updateIssue(issue: string): void {
        console.log(`Updating issue to server: ${issue}`);

        const message = {
            event: SocketEvent.ISSUE_UPDATED,
            userId: this.userId,
            roomId: this.roomId,
            payload: issue
        };

        if (!this.send(message)) {
            console.error("Failed to send issue update message, queueing");
        } else {
            console.log("Issue update message sent successfully");

            // Notify debug listeners for testing
            this.eventListeners.get('debug-event')?.forEach(callback => {
                callback({ type: 'issue-update-sent', issue });
            });
        }
    }
}

export default SocketService.getInstance();
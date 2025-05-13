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
    private isReconnecting: boolean = false;
    private lastVotes: Record<string, any> = {};

    // Track kicked status to prevent auto-reconnect
    private kicked: boolean = false;

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
        // Don't try to reconnect if kicked
        if (this.kicked) {
            console.log('Connection blocked: user was kicked from room');
            return {} as WebSocket;
        }

        // Check if we need to reconnect due to different room/user
        if (this.socket && this.socket.readyState === WebSocket.OPEN &&
            (this.roomId !== roomId || this.userId !== userId)) {
            console.log('Reconnecting with new room/user parameters');
            this.disconnect();
        }

        // Store values even if connection fails
        this.roomId = roomId;
        this.userId = userId;

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            // Get the WebSocket URL from environment variables
            this.url = process.env.NEXT_PUBLIC_DENO_WS_URL || '';
            if (!this.url || this.url === '') {
                throw new Error('WebSocket URL is not defined in environment variables');
            }

            // If we're already reconnecting, don't start another connection attempt
            if (this.isReconnecting) {
                console.log('Already reconnecting, skipping additional attempt');
                return this.socket as WebSocket;
            }

            this.isReconnecting = true;
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
                this.isReconnecting = false;
            }
        }

        return this.socket as WebSocket;
    }

    private handleOpen(event: Event) {
        console.log('WebSocket connected successfully');

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        this.isReconnecting = false;

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

        // Notify listeners of connection
        this.notifyListeners('connection', { status: 'connected' });

        // Request current room state after connecting
        this.requestRoomState();
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

            // Special handling for kicked event
            if (eventName === SocketEvent.KICKED) {
                this.kicked = true;
                console.log('User has been kicked from room');
            }

            // Special handling for votes events
            if (eventName === SocketEvent.VOTES_UPDATED) {
                this.lastVotes = payload;
            }

            // Dispatch event to all registered listeners
            this.notifyListeners(eventName, payload);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    private notifyListeners(eventName: string, payload: any) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName)?.forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
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
        this.isReconnecting = false;

        // Notify listeners of disconnection
        this.notifyListeners('connection', { status: 'disconnected', code: event.code, reason: event.reason });

        // Attempt to reconnect if not closed intentionally and not kicked
        if (event.code !== 1000 && !this.kicked) {
            this.attemptReconnect();
        }
    }

    private handleError(event: Event) {
        console.error('WebSocket error:', event);

        // Notify listeners of error
        this.notifyListeners('connection', { status: 'error', error: event });

        // Close the socket and attempt to reconnect
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.isReconnecting = false;

        // Only attempt reconnect if not kicked
        if (!this.kicked) {
            this.attemptReconnect();
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isReconnecting) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            // Notify listeners of reconnection attempt
            this.notifyListeners('connection', {
                status: 'reconnecting',
                attempt: this.reconnectAttempts,
                maxAttempts: this.maxReconnectAttempts,
                delay
            });

            setTimeout(() => {
                if (this.roomId && this.userId && !this.kicked) {
                    this.connect(this.roomId, this.userId);
                }
            }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Maximum reconnect attempts reached. WebSocket connection failed.');

            // Notify listeners of reconnection failure
            this.notifyListeners('connection', {
                status: 'reconnection_failed',
                attempts: this.reconnectAttempts
            });
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

        // Check if this message is already in the queue
        const isDuplicate = this.messageQueue.some(item =>
            item.event === data.event &&
            item.roomId === data.roomId &&
            item.userId === data.userId &&
            JSON.stringify(item.payload) === JSON.stringify(data.payload)
        );

        if (!isDuplicate) {
            this.messageQueue.push(data);
        } else {
            console.log('Message already in queue, skipping duplicate');
        }

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
            this.queueMessage(data);
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
            // Prepare the correct leave message first
            if (this.socket.readyState === WebSocket.OPEN) {
                this.send({
                    event: SocketEvent.LEAVE_ROOM,
                    userId: this.userId,
                    roomId: this.roomId,
                    payload: null
                });
            }

            // Now clear everything
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.close(1000, 'Client disconnected intentionally');
            }

            this.socket = null;
            this.isReconnecting = false;
            this.eventListeners.clear();  // Clear all listeners
            console.log('WebSocket disconnected');
        }

        // Reset kicked status on disconnect
        this.kicked = false;
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

        console.log(`Attempting to kick user: ${userId}`);

        if (!this.send(message)) {
            console.error("Failed to send kick user message, queueing");
        } else {
            console.log(`Kick user message sent for user: ${userId}`);
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

        console.log("Sending leave room message");

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

            // Add the vote to our local state immediately
            this.lastVotes[this.userId] = {
                userId: this.userId,
                value: value
            };

            // Notify vote updated listeners with our local votes
            this.notifyListeners(SocketEvent.VOTES_UPDATED, this.lastVotes);
        }
    }

    // Reveal votes with improved handling
    public revealVotes(reveal: boolean): void {
        console.log(`Revealing votes: ${reveal}`);

        const message = {
            event: SocketEvent.REVEAL_VOTES,
            userId: this.userId,
            roomId: this.roomId,
            payload: reveal
        };

        if (!this.send(message)) {
            console.error("Failed to send reveal votes message, queueing");
        } else {
            console.log("Reveal votes message sent successfully");

            // Also notify listeners directly for immediate feedback
            this.notifyListeners(SocketEvent.REVEAL_VOTES, reveal);
        }
    }

    // Reset votes with improved handling
    public resetVotes(): void {
        console.log("Resetting votes");

        const message = {
            event: SocketEvent.RESET_VOTES,
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        };

        if (!this.send(message)) {
            console.error("Failed to send reset votes message, queueing");
        } else {
            console.log("Reset votes message sent successfully");

            // Clear our local votes cache
            this.lastVotes = {};

            // Also notify listeners directly for immediate feedback
            this.notifyListeners(SocketEvent.RESET_VOTES, null);
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

            // Also notify listeners directly for immediate feedback
            this.notifyListeners(SocketEvent.ISSUE_UPDATED, issue);
        }
    }

    // Request the current room state from the server
    public requestRoomState(): void {
        console.log("Requesting current room state");

        const message = {
            event: 'request-state',
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        };

        if (!this.send(message)) {
            console.error("Failed to send room state request, queueing");
        } else {
            console.log("Room state request sent successfully");
        }
    }

    // Check if user was kicked
    public wasKicked(): boolean {
        return this.kicked;
    }

    // Reset kicked status (useful for testing)
    public resetKickedStatus(): void {
        this.kicked = false;
    }
}

export default SocketService.getInstance();
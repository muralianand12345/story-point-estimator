import { SocketEvent } from '@/types';

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
    private queueProcessor: NodeJS.Timeout | null = null;
    private messageQueue: Array<{ event: string, userId: string, roomId: string, payload: any }> = [];
    private isReconnecting: boolean = false;
    private kicked: boolean = false;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(roomId: string, userId: string): WebSocket {
        if (this.kicked) return {} as WebSocket;

        if (this.socket && this.socket.readyState === WebSocket.OPEN &&
            (this.roomId !== roomId || this.userId !== userId)) {
            this.disconnect();
        }

        this.roomId = roomId;
        this.userId = userId;

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.url = process.env.NEXT_PUBLIC_DENO_WS_URL || '';
            if (!this.url) {
                throw new Error('WebSocket URL is not defined');
            }

            if (this.isReconnecting) {
                return this.socket as WebSocket;
            }

            this.isReconnecting = true;

            try {
                this.socket = new WebSocket(this.url);
                this.socket.onopen = this.handleOpen.bind(this);
                this.socket.onmessage = this.handleMessage.bind(this);
                this.socket.onclose = this.handleClose.bind(this);
                this.socket.onerror = this.handleError.bind(this);
                this.startQueueProcessor();
            } catch (error) {
                console.error("Error creating WebSocket:", error);
                this.isReconnecting = false;
            }
        }

        return this.socket as WebSocket;
    }

    private handleOpen() {
        this.reconnectAttempts = 0;
        this.isReconnecting = false;

        this.send({
            event: 'init',
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        });

        this.startPingInterval();
        this.processQueue();
        this.notifyListeners('connection', { status: 'connected' });
        this.requestRoomState();
    }

    private startPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
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

            if (eventName === SocketEvent.KICKED) {
                this.kicked = true;
            }

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
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        this.socket = null;
        this.isReconnecting = false;
        this.notifyListeners('connection', { status: 'disconnected' });

        if (event.code !== 1000 && !this.kicked) {
            this.attemptReconnect();
        }
    }

    private handleError() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.isReconnecting = false;

        if (!this.kicked) {
            this.attemptReconnect();
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isReconnecting) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            this.notifyListeners('connection', {
                status: 'reconnecting',
                attempt: this.reconnectAttempts,
                maxAttempts: this.maxReconnectAttempts
            });

            setTimeout(() => {
                if (this.roomId && this.userId && !this.kicked) {
                    this.connect(this.roomId, this.userId);
                }
            }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.notifyListeners('connection', {
                status: 'reconnection_failed'
            });
        }
    }

    public on(event: string, callback: (data: any) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }

        const listeners = this.eventListeners.get(event);
        if (listeners && !listeners.includes(callback)) {
            listeners.push(callback);
        }
    }

    public off(event: string, callback?: (data: any) => void): void {
        if (!callback) {
            this.eventListeners.delete(event);
        } else if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event) || [];
            this.eventListeners.set(
                event,
                listeners.filter(cb => cb !== callback)
            );
        }
    }

    private queueMessage(data: any): void {
        const isDuplicate = this.messageQueue.some(item =>
            item.event === data.event &&
            item.roomId === data.roomId &&
            item.userId === data.userId &&
            JSON.stringify(item.payload) === JSON.stringify(data.payload)
        );

        if (!isDuplicate) {
            this.messageQueue.push(data);
        }

        this.startQueueProcessor();
    }

    private processQueue(): void {
        if (this.messageQueue.length === 0) return;

        if (this.socket?.readyState === WebSocket.OPEN) {
            const queueToProcess = [...this.messageQueue];
            this.messageQueue = [];

            queueToProcess.forEach(message => {
                try {
                    this.send(message);
                } catch (error) {
                    this.messageQueue.push(message);
                }
            });
        }
    }

    private startQueueProcessor(): void {
        if (this.queueProcessor) return;

        this.queueProcessor = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                this.processQueue();
            }

            if (this.messageQueue.length === 0 && this.queueProcessor) {
                clearInterval(this.queueProcessor);
                this.queueProcessor = null;
            }
        }, 1000);
    }

    private send(data: any): boolean {
        if (!this.socket) {
            console.log("No socket connection, queueing message", data);
            this.queueMessage(data);
            this.connect(this.roomId, this.userId);
            return false;
        }

        if (this.socket.readyState !== WebSocket.OPEN) {
            console.log("Socket not open, queueing message", data);
            this.queueMessage(data);

            // Force reconnect if socket is closed
            if (this.socket.readyState === WebSocket.CLOSED) {
                this.connect(this.roomId, this.userId);
            }
            return false;
        }

        try {
            const message = JSON.stringify(data);
            this.socket.send(message);
            console.log("Message sent successfully:", data.event);
            return true;
        } catch (error) {
            console.error("Error sending message:", error);
            this.queueMessage(data);
            return false;
        }
    }

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
            if (this.socket.readyState === WebSocket.OPEN) {
                this.send({
                    event: SocketEvent.LEAVE_ROOM,
                    userId: this.userId,
                    roomId: this.roomId,
                    payload: null
                });
            }

            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.close(1000, 'Client disconnected intentionally');
            }

            this.socket = null;
            this.isReconnecting = false;
            this.eventListeners.clear();
        }

        this.kicked = false;
    }

    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    public kickUser(userId: string): void {
        this.send({
            event: SocketEvent.KICK_USER,
            userId: this.userId,
            roomId: this.roomId,
            payload: userId
        });
    }

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

        this.disconnect();
    }

    public submitVote(value: number | null): void {
        this.send({
            event: SocketEvent.SUBMIT_VOTE,
            userId: this.userId,
            roomId: this.roomId,
            payload: value
        });
    }

    public revealVotes(reveal: boolean): void {
        this.send({
            event: SocketEvent.REVEAL_VOTES,
            userId: this.userId,
            roomId: this.roomId,
            payload: reveal
        });
    }

    public resetVotes(): void {
        this.send({
            event: SocketEvent.RESET_VOTES,
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        });
    }

    public updateIssue(issue: string): void {
        this.send({
            event: SocketEvent.ISSUE_UPDATED,
            userId: this.userId,
            roomId: this.roomId,
            payload: issue
        });
    }

    public requestRoomState(): void {
        this.send({
            event: 'request-state',
            userId: this.userId,
            roomId: this.roomId,
            payload: null
        });
    }
}

export default SocketService.getInstance();
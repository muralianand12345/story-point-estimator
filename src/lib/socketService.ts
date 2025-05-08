import { io, Socket } from 'socket.io-client';
import { SocketEvent } from '@/types';

// Class to manage socket connections
export class SocketService {
    private static instance: SocketService;
    private socket: Socket | null = null;

    private constructor() { }

    // Singleton pattern to ensure only one socket connection
    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    // Connect to the Socket.io server
    public connect(roomId: string, userId: string): Socket {
        if (!this.socket) {
            this.socket = io({
                path: '/api/socketio',
                query: {
                    roomId,
                    userId,
                },
            });

            console.log('Socket connected');
        }
        return this.socket;
    }

    // Disconnect the socket
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('Socket disconnected');
        }
    }

    // Get the socket instance
    public getSocket(): Socket | null {
        return this.socket;
    }

    // Check if socket is connected
    public isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Emit a kick user event
    public kickUser(userId: string): void {
        this.socket?.emit(SocketEvent.KICK_USER, userId);
    }

    // Emit a leave room event
    public leaveRoom(): void {
        this.socket?.emit(SocketEvent.LEAVE_ROOM);
        this.disconnect();
    }
}

export default SocketService.getInstance();
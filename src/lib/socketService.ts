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
            console.log(`Connecting socket for room ${roomId}, user ${userId}`);
            this.socket = io({
                path: '/api/socketio',
                query: {
                    roomId,
                    userId,
                },
            });

            this.socket.on('connect', () => {
                console.log('Socket connected successfully');
            });

            this.socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            this.socket.on('error', (err) => {
                console.error('Socket error:', err);
            });
        } else {
            console.log('Socket already connected');
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

    public submitVote(value: number | null): void {
        console.log(`Submitting vote: ${value}`);
        if (this.socket) {
            this.socket.emit(SocketEvent.SUBMIT_VOTE, value);
            console.log('Vote submitted successfully');
        } else {
            console.error('Socket not connected, cannot submit vote');
        }
    }

    public revealVotes(reveal: boolean): void {
        this.socket?.emit(SocketEvent.REVEAL_VOTES, reveal);
    }

    public resetVotes(): void {
        this.socket?.emit(SocketEvent.RESET_VOTES);
    }

    public updateIssue(issue: string): void {
        this.socket?.emit(SocketEvent.ISSUE_UPDATED, issue);
    }
}

export default SocketService.getInstance();
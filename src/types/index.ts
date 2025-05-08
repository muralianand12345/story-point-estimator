// Type definitions for the application

export interface User {
    id: string;
    name: string;
    createdAt?: string;
}

export interface Room {
    id: string;
    name: string;
    roomCode: string;
    hostId: string;
    isActive: boolean;
    createdAt: string;
}

export interface RoomUser {
    roomId: string;
    userId: string;
    joinedAt: string;
}

export interface RoomData {
    room: Room;
    users: User[];
    isHost: boolean;
    currentUser: User | null;
}

// Socket events
export enum SocketEvent {
    USER_JOINED = 'user-joined',
    USER_LEFT = 'user-left',
    HOST_CHANGED = 'host-changed',
    KICKED = 'kicked',
    KICK_USER = 'kick-user',
    LEAVE_ROOM = 'leave-room'
}
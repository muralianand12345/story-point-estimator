export interface User {
    id: string;
    name: string;
    created_at: Date;
}

export interface Room {
    id: string;
    name: string;
    room_code: string;
    host_id: string;
    is_active: boolean;
    created_at: Date;
}

export interface RoomUser {
    room_id: string;
    user_id: string;
    joined_at: Date;
}

export interface VoteRecord {
    id: string;
    room_id: string;
    user_id: string;
    value: number | null;
    created_at: Date;
}

export interface Issue {
    id: string;
    room_id: string;
    title: string;
    created_at: Date;
}

// API Request/Response interfaces
export interface CreateRoomRequest {
    roomName: string;
    hostName: string;
}

export interface CreateRoomResponse {
    roomId: string;
    roomCode: string;
    userId: string;
    userName: string;
}

export interface JoinRoomRequest {
    userName: string;
}

export interface JoinRoomResponse {
    userId: string;
    userName: string;
}

export interface CheckRoomResponse {
    exists: boolean;
    roomId: string | null;
}

export interface FindRoomByCodeResponse {
    exists: boolean;
    roomId: string | null;
}

export interface RoomDataResponse {
    room: {
        id: string;
        name: string;
        roomCode: string;
        hostId: string;
        isActive: boolean;
        createdAt: string;
    };
    users: Array<{
        id: string;
        name: string;
        createdAt: string;
    }>;
}
// Base URL for the Deno API - should be set in environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_DENO_API_URL || 'https://your-deno-api.com';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchWithErrorHandling<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

export interface CreateRoomRequest {
    roomName: string;
    hostName: string;
}

export interface JoinRoomRequest {
    userName: string;
}

export interface RoomCheckResponse {
    exists: boolean;
    roomId: string | null;
}

export interface FindRoomByCodeResponse {
    exists: boolean;
    roomId: string | null;
}

export interface CreateRoomResponse {
    roomId: string;
    roomCode: string;
    userId: string;
    userName: string;
}

export interface JoinRoomResponse {
    userId: string;
    userName: string;
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

const apiService = {
    /**
     * Create a new room
     */
    createRoom: (data: CreateRoomRequest): Promise<CreateRoomResponse> => {
        return fetchWithErrorHandling(`${API_BASE_URL}/rooms`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Join an existing room
     */
    joinRoom: (roomId: string, data: JoinRoomRequest): Promise<JoinRoomResponse> => {
        return fetchWithErrorHandling(`${API_BASE_URL}/rooms/${roomId}/join`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Check if a room exists and is active
     */
    checkRoom: (roomId: string): Promise<RoomCheckResponse> => {
        return fetchWithErrorHandling(`${API_BASE_URL}/rooms/${roomId}/check`);
    },

    /**
     * Find a room by its join code
     */
    findRoomByCode: (code: string): Promise<FindRoomByCodeResponse> => {
        return fetchWithErrorHandling(`${API_BASE_URL}/rooms/code/${code}`);
    },

    /**
     * Get room details including users
     */
    getRoomData: (roomId: string): Promise<RoomDataResponse> => {
        return fetchWithErrorHandling(`${API_BASE_URL}/rooms/${roomId}`);
    }
};

export default apiService;
// WebSocket client connection interface
export interface WebSocketClient extends WebSocket {
    userId?: string;
    roomId?: string;
}

// Database models
export interface User {
    id: string;
    name: string;
    created_at: Date;
}

export interface Room {
    id: string;
    name: string;
    room_code: string;
    created_at: Date;
    host_id: string;
    is_active: boolean;
}

// Socket events
export enum SocketEvent {
    USER_JOINED = 'user-joined',
    USER_LEFT = 'user-left',
    HOST_CHANGED = 'host-changed',
    KICKED = 'kicked',
    KICK_USER = 'kick-user',
    LEAVE_ROOM = 'leave-room',
    SUBMIT_VOTE = 'submit-vote',
    REVEAL_VOTES = 'reveal-votes',
    RESET_VOTES = 'reset-votes',
    VOTES_UPDATED = 'votes-updated',
    ISSUE_UPDATED = 'issue-updated'
}

export interface Vote {
    userId: string;
    value: number | null;
}

export interface VotingState {
    isRevealed: boolean;
    votes: Record<string, Vote>;
    currentIssue: string;
}

export interface SocketMessage {
    event: string;
    userId?: string;
    roomId?: string;
    payload?: unknown;
}
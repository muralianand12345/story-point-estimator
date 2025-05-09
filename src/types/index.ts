export interface Vote {
    userId: string;
    value: number | null;
}

export interface VotingState {
    isRevealed: boolean;
    votes: Record<string, Vote>;
    currentIssue: string;
}

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
    LEAVE_ROOM = 'leave-room',
    SUBMIT_VOTE = 'submit-vote',
    REVEAL_VOTES = 'reveal-votes',
    RESET_VOTES = 'reset-votes',
    VOTES_UPDATED = 'votes-updated',
    ISSUE_UPDATED = 'issue-updated'
}
import { Room } from "./room.ts";

// Base interface for all messages
export interface WebSocketMessage {
    type: string;
    payload: unknown;
}

// Join room message
export interface JoinRoomMessage extends WebSocketMessage {
    type: "join_room";
    payload: {
        roomId: string;
        userId: string;
        userName: string;
    };
}

// Leave room message
export interface LeaveRoomMessage extends WebSocketMessage {
    type: "leave_room";
    payload: {
        roomId: string;
        userId: string;
    };
}

// Vote message
export interface VoteMessage extends WebSocketMessage {
    type: "vote";
    payload: {
        roomId: string;
        userId: string;
        vote: string;
    };
}

// Reveal votes message
export interface RevealVotesMessage extends WebSocketMessage {
    type: "reveal_votes";
    payload: {
        roomId: string;
        userId: string;
    };
}

// Reset votes message
export interface ResetVotesMessage extends WebSocketMessage {
    type: "reset_votes";
    payload: {
        roomId: string;
        userId: string;
    };
}

// Update issue name message
export interface UpdateIssueNameMessage extends WebSocketMessage {
    type: "update_issue_name";
    payload: {
        roomId: string;
        userId: string;
        issueName: string;
    };
}

// Kick user message
export interface KickUserMessage extends WebSocketMessage {
    type: "kick_user";
    payload: {
        roomId: string;
        userId: string;
        targetUserId: string;
    };
}

// Room state message (sent to clients)
export interface RoomStateMessage extends WebSocketMessage {
    type: "room_state";
    payload: {
        room: Room;
    };
}

// Error message (sent to clients)
export interface ErrorMessage extends WebSocketMessage {
    type: "error";
    payload: {
        message: string;
    };
}

// Kicked message (sent to clients)
export interface KickedMessage extends WebSocketMessage {
    type: "kicked";
    payload: {
        roomId: string;
    };
}

// Union type of all incoming messages
export type IncomingMessage =
    | JoinRoomMessage
    | LeaveRoomMessage
    | VoteMessage
    | RevealVotesMessage
    | ResetVotesMessage
    | UpdateIssueNameMessage
    | KickUserMessage;

// Union type of all outgoing messages
export type OutgoingMessage =
    | RoomStateMessage
    | ErrorMessage
    | KickedMessage;
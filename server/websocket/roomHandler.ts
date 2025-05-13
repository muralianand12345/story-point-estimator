import { WebSocketClient, Room, User } from "../types/room.ts";
import {
    WebSocketMessage,
    JoinRoomMessage,
    LeaveRoomMessage,
    VoteMessage,
    RevealVotesMessage,
    ResetVotesMessage,
    UpdateIssueNameMessage,
    KickUserMessage,
    RoomStateMessage,
    ErrorMessage,
    KickedMessage,
    OutgoingMessage
} from "../types/messages.ts";
import { roomStore } from "../db/store.ts";
import { v4 as uuidv4 } from "uuid";

// Map to track connected WebSocket clients
const clients = new Map<string, WebSocketClient>();

// Send message to all clients in a room
const broadcastToRoom = (roomId: string, message: OutgoingMessage): void => {
    for (const client of clients.values()) {
        if (client.roomId === roomId) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`Error broadcasting to client ${client.id}:`, error);
            }
        }
    }
};

// Send updated room state to all clients in a room
const broadcastRoomState = (room: Room): void => {
    const message: RoomStateMessage = {
        type: "room_state",
        payload: {
            room
        }
    };
    broadcastToRoom(room.id, message);
};

// Handle client connection
export const handleConnection = (ws: WebSocket): void => {
    const clientId = uuidv4();

    console.log(`New WebSocket connection: ${clientId}`);

    // Set up message handler
    ws.onmessage = (event: MessageEvent): void => {
        try {
            const message = JSON.parse(event.data) as WebSocketMessage;

            // Log message for debugging
            console.log(`Received message from client ${clientId}:`, message.type);

            handleMessage(clientId, ws, message);
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            const errorMessage: ErrorMessage = {
                type: "error",
                payload: {
                    message: "Invalid message format"
                }
            };
            ws.send(JSON.stringify(errorMessage));
        }
    };

    // Set up close handler
    ws.onclose = (event): void => {
        console.log(`WebSocket closed for client ${clientId} with code ${event.code} and reason: ${event.reason}`);
        handleDisconnect(clientId);
    };

    // Set up error handler
    ws.onerror = (error: Event | ErrorEvent): void => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        handleDisconnect(clientId);
    };
};

// Handle client messages
const handleMessage = (clientId: string, ws: WebSocket, message: WebSocketMessage): void => {
    const { type } = message;

    switch (type) {
        case "join_room": {
            handleJoinRoom(clientId, ws, message as JoinRoomMessage);
            break;
        }
        case "leave_room": {
            handleLeaveRoom(clientId, message as LeaveRoomMessage);
            break;
        }
        case "vote": {
            handleVote(clientId, message as VoteMessage);
            break;
        }
        case "reveal_votes": {
            handleRevealVotes(clientId, message as RevealVotesMessage);
            break;
        }
        case "reset_votes": {
            handleResetVotes(clientId, message as ResetVotesMessage);
            break;
        }
        case "update_issue_name": {
            handleUpdateIssueName(clientId, message as UpdateIssueNameMessage);
            break;
        }
        case "kick_user": {
            handleKickUser(clientId, message as KickUserMessage);
            break;
        }
        default: {
            const errorMessage: ErrorMessage = {
                type: "error",
                payload: {
                    message: "Unknown message type"
                }
            };
            ws.send(JSON.stringify(errorMessage));
        }
    }
};

// Handle join room request
const handleJoinRoom = (clientId: string, ws: WebSocket, message: JoinRoomMessage): void => {
    const { roomId, userId, userName } = message.payload;

    // Check if room exists
    let room = roomStore.getRoom(roomId);

    if (!room) {
        const errorMessage: ErrorMessage = {
            type: "error",
            payload: {
                message: "Room not found"
            }
        };
        ws.send(JSON.stringify(errorMessage));
        return;
    }

    // Check if user is already in the room
    const existingUser = room.users.find((u) => u.id === userId);

    if (existingUser) {
        // Update existing user
        existingUser.name = userName;
    } else {
        // Add new user
        const newUser: User = {
            id: userId,
            name: userName,
            isHost: false,
            vote: null
        };

        room = roomStore.addUserToRoom(roomId, newUser) as Room;
    }

    // Add client to clients map
    clients.set(clientId, {
        id: clientId,
        userId,
        roomId,
        ws
    });

    // Send room state to all clients
    broadcastRoomState(room);
};

// Handle leave room request
const handleLeaveRoom = (clientId: string, message: LeaveRoomMessage): void => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId } = message.payload;

    // Remove user from room
    const room = roomStore.removeUserFromRoom(roomId, userId);

    if (room) {
        // Send room state to all remaining clients
        broadcastRoomState(room);
    }

    // Remove client from clients map
    clients.delete(clientId);
};

// Handle client disconnect
const handleDisconnect = (clientId: string): void => {
    console.log(`WebSocket client disconnected: ${clientId}`);

    const client = clients.get(clientId);
    if (!client) return;

    // Remove user from room
    const room = roomStore.removeUserFromRoom(client.roomId, client.userId);

    if (room) {
        // Send room state to all remaining clients
        broadcastRoomState(room);
    }

    // Remove client from clients map
    clients.delete(clientId);
};

// Handle vote submission
const handleVote = (clientId: string, message: VoteMessage): void => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId, vote } = message.payload;

    // Update user's vote
    const room = roomStore.updateUserVote(roomId, userId, vote);

    if (room) {
        // Send room state to all clients
        broadcastRoomState(room);
    }
};

// Handle revealing votes
const handleRevealVotes = (clientId: string, message: RevealVotesMessage): void => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId } = message.payload;

    // Check if user is host
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId !== userId) {
        const errorMessage: ErrorMessage = {
            type: "error",
            payload: {
                message: "Only the host can reveal votes"
            }
        };
        client.ws.send(JSON.stringify(errorMessage));
        return;
    }

    // Reveal votes
    const updatedRoom = roomStore.revealVotes(roomId);

    if (updatedRoom) {
        // Send room state to all clients
        broadcastRoomState(updatedRoom);
    }
};

// Handle resetting votes
const handleResetVotes = (clientId: string, message: ResetVotesMessage): void => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId } = message.payload;

    // Check if user is host
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId !== userId) {
        const errorMessage: ErrorMessage = {
            type: "error",
            payload: {
                message: "Only the host can reset votes"
            }
        };
        client.ws.send(JSON.stringify(errorMessage));
        return;
    }

    // Reset votes
    const updatedRoom = roomStore.resetVotes(roomId);

    if (updatedRoom) {
        // Send room state to all clients
        broadcastRoomState(updatedRoom);
    }
};

// Handle updating issue name
const handleUpdateIssueName = (clientId: string, message: UpdateIssueNameMessage): void => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId, issueName } = message.payload;

    // Check if user is host
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId !== userId) {
        const errorMessage: ErrorMessage = {
            type: "error",
            payload: {
                message: "Only the host can update the issue name"
            }
        };
        client.ws.send(JSON.stringify(errorMessage));
        return;
    }

    // Update issue name
    const updatedRoom = roomStore.updateIssueName(roomId, issueName);

    if (updatedRoom) {
        // Send room state to all clients
        broadcastRoomState(updatedRoom);
    }
};

// Handle kicking a user
const handleKickUser = (clientId: string, message: KickUserMessage): void => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId, targetUserId } = message.payload;

    // Check if user is host
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId !== userId) {
        const errorMessage: ErrorMessage = {
            type: "error",
            payload: {
                message: "Only the host can kick users"
            }
        };
        client.ws.send(JSON.stringify(errorMessage));
        return;
    }

    // Find target client
    let targetClientId: string | undefined;
    for (const [id, c] of clients.entries()) {
        if (c.userId === targetUserId && c.roomId === roomId) {
            targetClientId = id;
            break;
        }
    }

    if (targetClientId) {
        const targetClient = clients.get(targetClientId);
        if (targetClient) {
            // Notify target user they've been kicked
            const kickedMessage: KickedMessage = {
                type: "kicked",
                payload: {
                    roomId
                }
            };
            targetClient.ws.send(JSON.stringify(kickedMessage));

            // Close target user's connection
            try {
                targetClient.ws.close();
            } catch (error) {
                console.error(`Error closing WebSocket for client ${targetClientId}:`, error);
            }
        }
    }

    // Remove target user from room
    const updatedRoom = roomStore.removeUserFromRoom(roomId, targetUserId);

    if (updatedRoom) {
        // Send room state to all remaining clients
        broadcastRoomState(updatedRoom);
    }
};
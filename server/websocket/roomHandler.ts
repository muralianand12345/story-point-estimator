import { WebSocketClient, Room, User } from "../types/room.ts";
import { roomStore } from "../db/store.ts";
import { v4 as uuidv4 } from "uuid";

// Map to track connected WebSocket clients
const clients = new Map<string, WebSocketClient>();

// Send message to all clients in a room
const broadcastToRoom = (roomId: string, message: any) => {
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
const broadcastRoomState = (room: Room) => {
    broadcastToRoom(room.id, {
        type: "room_state",
        payload: {
            room
        }
    });
};

// Handle client connection
export const handleConnection = (ws: WebSocket) => {
    const clientId = uuidv4();

    console.log(`New WebSocket connection: ${clientId}`);

    // Set up message handler
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleMessage(clientId, ws, message);
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            ws.send(JSON.stringify({
                type: "error",
                payload: {
                    message: "Invalid message format"
                }
            }));
        }
    };

    // Set up close handler
    ws.onclose = () => {
        handleDisconnect(clientId);
    };

    // Set up error handler
    ws.onerror = (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        handleDisconnect(clientId);
    };
};

// Handle client messages
const handleMessage = (clientId: string, ws: WebSocket, message: any) => {
    const { type, payload } = message;

    switch (type) {
        case "join_room":
            handleJoinRoom(clientId, ws, payload);
            break;

        case "leave_room":
            handleLeaveRoom(clientId, payload);
            break;

        case "vote":
            handleVote(clientId, payload);
            break;

        case "reveal_votes":
            handleRevealVotes(clientId, payload);
            break;

        case "reset_votes":
            handleResetVotes(clientId, payload);
            break;

        case "update_issue_name":
            handleUpdateIssueName(clientId, payload);
            break;

        case "kick_user":
            handleKickUser(clientId, payload);
            break;

        default:
            ws.send(JSON.stringify({
                type: "error",
                payload: {
                    message: "Unknown message type"
                }
            }));
    }
};

// Handle join room request
const handleJoinRoom = (clientId: string, ws: WebSocket, payload: any) => {
    const { roomId, userId, userName } = payload;

    // Check if room exists
    let room = roomStore.getRoom(roomId);

    if (!room) {
        ws.send(JSON.stringify({
            type: "error",
            payload: {
                message: "Room not found"
            }
        }));
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
const handleLeaveRoom = (clientId: string, payload: any) => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId } = payload;

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
const handleDisconnect = (clientId: string) => {
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
const handleVote = (clientId: string, payload: any) => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId, vote } = payload;

    // Update user's vote
    const room = roomStore.updateUserVote(roomId, userId, vote);

    if (room) {
        // Send room state to all clients
        broadcastRoomState(room);
    }
};

// Handle revealing votes
const handleRevealVotes = (clientId: string, payload: any) => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId } = payload;

    // Check if user is host
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId !== userId) {
        client.ws.send(JSON.stringify({
            type: "error",
            payload: {
                message: "Only the host can reveal votes"
            }
        }));
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
const handleResetVotes = (clientId: string, payload: any) => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId } = payload;

    // Check if user is host
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId !== userId) {
        client.ws.send(JSON.stringify({
            type: "error",
            payload: {
                message: "Only the host can reset votes"
            }
        }));
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
const handleUpdateIssueName = (clientId: string, payload: any) => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId, issueName } = payload;

    // Check if user is host
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId !== userId) {
        client.ws.send(JSON.stringify({
            type: "error",
            payload: {
                message: "Only the host can update the issue name"
            }
        }));
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
const handleKickUser = (clientId: string, payload: any) => {
    const client = clients.get(clientId);
    if (!client) return;

    const { roomId, userId, targetUserId } = payload;

    // Check if user is host
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId !== userId) {
        client.ws.send(JSON.stringify({
            type: "error",
            payload: {
                message: "Only the host can kick users"
            }
        }));
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
            targetClient.ws.send(JSON.stringify({
                type: "kicked",
                payload: {
                    roomId
                }
            }));

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
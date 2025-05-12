import { db } from "../db/client.ts";
import {
    SocketEvent,
    SocketMessage,
    VotingState,
    WebSocketClient
} from "../types/index.ts";

// Store all active WebSocket connections
const clients: Map<string, WebSocketClient> = new Map();

// Store all room voting states
const votingStates: Map<string, VotingState> = new Map();

// Helper to get all clients in a room
const getRoomClients = (roomId: string): WebSocketClient[] => {
    return Array.from(clients.values()).filter(client => client.roomId === roomId);
};

// Send a message to a specific client
const sendToClient = (client: WebSocketClient, event: SocketEvent, payload?: unknown) => {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, payload }));
    }
};

// Send a message to all clients in a room
const broadcastToRoom = (roomId: string, event: SocketEvent, payload?: unknown, excludeUserId?: string) => {
    const roomClients = getRoomClients(roomId);
    for (const client of roomClients) {
        if (!excludeUserId || client.userId !== excludeUserId) {
            sendToClient(client, event, payload);
        }
    }
};

// Initialize room voting state if it doesn't exist
const initRoomVotingState = (roomId: string): VotingState => {
    if (!votingStates.has(roomId)) {
        votingStates.set(roomId, {
            isRevealed: false,
            votes: {},
            currentIssue: ''
        });
    }
    return votingStates.get(roomId)!;
};

// Handle WebSocket connection
export const handleWebSocketConnection = (socket: WebSocketClient) => {
    socket.onopen = () => {
        console.log("WebSocket connection opened");
    };

    socket.onmessage = async (e) => {
        try {
            const data = JSON.parse(e.data) as SocketMessage;
            const { event, userId, roomId, payload } = data;

            // Handle the 'init' event which is sent by the client upon connection
            if (event === 'init' && userId && roomId) {
                socket.userId = userId;
                socket.roomId = roomId;
                clients.set(userId, socket);
                console.log(`User ${userId} connected to room ${roomId}`);

                // Initialize voting state for the room
                const votingState = initRoomVotingState(roomId);

                // Notify others in the room about the new user
                broadcastToRoom(roomId, SocketEvent.USER_JOINED, { userId }, userId);

                // Send current voting state to the newly connected user
                sendToClient(socket, SocketEvent.VOTES_UPDATED, votingState.votes);
                sendToClient(socket, SocketEvent.REVEAL_VOTES, votingState.isRevealed);
                if (votingState.currentIssue) {
                    sendToClient(socket, SocketEvent.ISSUE_UPDATED, votingState.currentIssue);
                }
                return; // Exit early after handling init
            }

            // Process other events (only if userId and roomId are already set)
            if (socket.userId && socket.roomId) {
                await handleSocketEvent(socket, event as SocketEvent, payload);
            } else {
                console.error("Received message before initialization");
            }
        } catch (error) {
            console.error("Error handling WebSocket message:", error);
        }
    };

    socket.onclose = async (_error) => {
        if (socket.userId && socket.roomId) {
            await handleUserDisconnect(socket.userId, socket.roomId);
            clients.delete(socket.userId);
        }
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        socket.close();
    };
};

// Handle user disconnect (leaving or being kicked)
const handleUserDisconnect = async (userId: string, roomId: string) => {
    try {
        console.log(`User ${userId} disconnected from room ${roomId}`);

        // Remove user's vote if they had one
        const votingState = votingStates.get(roomId);
        if (votingState && votingState.votes[userId]) {
            delete votingState.votes[userId];
            broadcastToRoom(roomId, SocketEvent.VOTES_UPDATED, votingState.votes);
        }

        // Check if user is host
        const room = await db.findRoomById(roomId);
        if (room) {
            // If disconnected user is the host, reassign host role
            if (room.host_id === userId) {
                // Find next host (earliest joined user)
                const nextHostId = await db.findNextHost(roomId, userId);

                if (nextHostId) {
                    // Update host in database
                    await db.updateRoomHost(roomId, nextHostId);

                    // Notify everyone about the new host
                    broadcastToRoom(roomId, SocketEvent.HOST_CHANGED, nextHostId);
                    console.log(`New host assigned: ${nextHostId}`);
                } else {
                    // No users left, deactivate room
                    await db.deactivateRoom(roomId);

                    // Clean up voting state
                    votingStates.delete(roomId);
                    console.log(`Room ${roomId} deactivated`);
                }
            }
        }

        // Remove user from room in database
        await db.removeUserFromRoom(roomId, userId);

        // Notify everyone that the user has left
        broadcastToRoom(roomId, SocketEvent.USER_LEFT, userId);
    } catch (error) {
        console.error('Error handling user disconnection:', error);
    }
};

// Handle various socket events
const handleSocketEvent = async (socket: WebSocketClient, event: SocketEvent, payload: unknown) => {
    if (!socket.userId || !socket.roomId) return;

    const roomId = socket.roomId;
    const userId = socket.userId;

    switch (event) {
        case SocketEvent.SUBMIT_VOTE:
            await handleSubmitVote(roomId, userId, payload as number | null);
            break;
        case SocketEvent.REVEAL_VOTES:
            await handleRevealVotes(roomId, userId, payload as boolean);
            break;
        case SocketEvent.RESET_VOTES:
            await handleResetVotes(roomId, userId);
            break;
        case SocketEvent.ISSUE_UPDATED:
            await handleIssueUpdated(roomId, userId, payload as string);
            break;
        case SocketEvent.KICK_USER:
            await handleKickUser(roomId, userId, payload as string);
            break;
        case SocketEvent.LEAVE_ROOM:
            await handleLeaveRoom(roomId, userId);
            break;
        default:
            console.log(`Unhandled event: ${event}`);
    }
};

// Handle vote submission
const handleSubmitVote = (roomId: string, userId: string, value: number | null) => {
    console.log(`Received vote from user ${userId} in room ${roomId}: ${value}`);

    // Initialize voting state if it doesn't exist
    const votingState = initRoomVotingState(roomId);

    // Don't allow voting if votes are revealed
    if (votingState.isRevealed) {
        console.log('Votes are already revealed, ignoring vote');
        return;
    }

    // Add or update the vote
    votingState.votes[userId] = { userId, value };

    // Broadcast the updated votes to all clients in the room
    broadcastToRoom(roomId, SocketEvent.VOTES_UPDATED, votingState.votes);
};

// Handle vote reveal request
const handleRevealVotes = async (roomId: string, userId: string, reveal: boolean) => {
    try {
        // Verify the requesting user is the host
        const room = await db.findRoomById(roomId);
        if (!room || room.host_id !== userId) {
            console.log(`Unauthorized reveal attempt by non-host user ${userId}`);
            return;
        }

        const votingState = votingStates.get(roomId);
        if (votingState) {
            votingState.isRevealed = reveal;
            broadcastToRoom(roomId, SocketEvent.REVEAL_VOTES, reveal);
        }
    } catch (error) {
        console.error('Error revealing votes:', error);
    }
};

// Handle vote reset
const handleResetVotes = async (roomId: string, userId: string) => {
    try {
        // Verify the requesting user is the host
        const room = await db.findRoomById(roomId);
        if (!room || room.host_id !== userId) {
            console.log(`Unauthorized reset attempt by non-host user ${userId}`);
            return;
        }

        // Reset voting state
        const votingState = initRoomVotingState(roomId);
        votingState.votes = {};
        votingState.isRevealed = false;

        // Notify all users in the room
        broadcastToRoom(roomId, SocketEvent.RESET_VOTES);
    } catch (error) {
        console.error('Error resetting votes:', error);
    }
};

// Handle issue update
const handleIssueUpdated = async (roomId: string, userId: string, issue: string) => {
    try {
        // Verify the requesting user is the host
        const room = await db.findRoomById(roomId);
        if (!room || room.host_id !== userId) {
            console.log(`Unauthorized issue update attempt by non-host user ${userId}`);
            return;
        }

        const votingState = initRoomVotingState(roomId);
        votingState.currentIssue = issue;
        broadcastToRoom(roomId, SocketEvent.ISSUE_UPDATED, issue);
    } catch (error) {
        console.error('Error updating issue:', error);
    }
};

// Handle kick user request
const handleKickUser = async (roomId: string, userId: string, kickUserId: string) => {
    try {
        // Verify the requesting user is the host
        const room = await db.findRoomById(roomId);
        if (!room || room.host_id !== userId) {
            console.log(`Unauthorized kick attempt by non-host user ${userId}`);
            return;
        }

        // Get the socket of the user to kick
        const socketToKick = clients.get(kickUserId);
        if (socketToKick) {
            // Notify the user they've been kicked
            sendToClient(socketToKick, SocketEvent.KICKED);
            socketToKick.close();
        }

        // Remove user's vote if they had one
        const votingState = votingStates.get(roomId);
        if (votingState && votingState.votes[kickUserId]) {
            delete votingState.votes[kickUserId];
            broadcastToRoom(roomId, SocketEvent.VOTES_UPDATED, votingState.votes);
        }

        // Remove user from room in database
        await db.removeUserFromRoom(roomId, kickUserId);

        // Notify everyone that user has been kicked
        broadcastToRoom(roomId, SocketEvent.USER_LEFT, kickUserId);
    } catch (error) {
        console.error('Error kicking user:', error);
    }
};

// Handle leave room request
const handleLeaveRoom = (roomId: string, userId: string) => {
    try {
        // Remove user's vote if they had one
        const votingState = votingStates.get(roomId);
        if (votingState && votingState.votes[userId]) {
            delete votingState.votes[userId];
            broadcastToRoom(roomId, SocketEvent.VOTES_UPDATED, votingState.votes);
        }

        // Close the WebSocket connection
        const socket = clients.get(userId);
        if (socket) {
            socket.close();
        }
    } catch (error) {
        console.error('Error leaving room:', error);
    }
};
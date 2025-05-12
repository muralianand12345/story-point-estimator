import { WebSocketClient, SocketEvent, SocketMessage, Vote, VotingState } from "./types.ts";
import { roomDB, roomUserDB, voteDB, issueDB } from "../db/schema.ts";
import { VoteRecord, Issue } from "../models/types.ts";

class RoomManager {
    private clients: Map<string, WebSocketClient> = new Map();
    private roomStates: Map<string, VotingState> = new Map();

    constructor() {
        console.log("Room Manager initialized");
    }

    // Register a new client connection
    registerClient(socket: WebSocket, userId: string, roomId: string): void {
        const clientId = `${userId}-${roomId}`;

        // If client already exists, update the socket reference
        const existingClient = this.clients.get(clientId);
        if (existingClient) {
            console.log(`Updating existing client: ${clientId}`);
            existingClient.socket = socket;
        } else {
            console.log(`Client registered: ${clientId}`);
            this.clients.set(clientId, { socket, userId, roomId });

            // Notify room about new user only if it's a new client
            this.broadcastToRoom(roomId, {
                event: SocketEvent.USER_JOINED,
                userId,
                roomId,
                payload: userId
            });
        }

        // Initialize room state if not exists
        if (!this.roomStates.has(roomId)) {
            this.initializeRoomState(roomId);
        }

        // Send current state to client regardless if they're new or not
        const roomState = this.roomStates.get(roomId);
        if (roomState) {
            // Send all state information directly to this client
            try {
                socket.send(JSON.stringify({
                    event: SocketEvent.VOTES_UPDATED,
                    payload: roomState.votes
                }));

                socket.send(JSON.stringify({
                    event: SocketEvent.REVEAL_VOTES,
                    payload: roomState.isRevealed
                }));

                if (roomState.currentIssue) {
                    socket.send(JSON.stringify({
                        event: SocketEvent.ISSUE_UPDATED,
                        payload: roomState.currentIssue
                    }));
                }
            } catch (error) {
                console.error(`Error sending initial state to client ${clientId}: ${error}`);
            }
        }
    }

    // Initialize room state
    async initializeRoomState(roomId: string): Promise<void> {
        console.log(`Initializing room state for room: ${roomId}`);

        try {
            // Get votes for this room
            const votes: VoteRecord[] = await voteDB.getRoomVotes(roomId);
            const votesMap: Record<string, Vote> = {};

            votes.forEach(vote => {
                votesMap[vote.user_id] = {
                    userId: vote.user_id,
                    value: vote.value
                };
            });

            // Get current issue
            const issue: Issue | null = await issueDB.getCurrentIssue(roomId);
            const currentIssue = issue ? issue.title : "";

            // Set initial state
            this.roomStates.set(roomId, {
                isRevealed: false,
                votes: votesMap,
                currentIssue
            });

            console.log(`Room state initialized for room: ${roomId}`);
        } catch (error) {
            console.error(`Error initializing room state: ${error}`);
        }
    }

    // Handle incoming messages
    async handleMessage(clientId: string, message: SocketMessage): Promise<void> {
        const client = this.clients.get(clientId);
        if (!client) {
            console.warn(`Received message from unknown client: ${clientId}`);
            return;
        }

        const { event, userId, roomId, payload } = message;
        console.log(`Received event: ${event} from user: ${userId} in room: ${roomId}`);

        if (client.userId !== userId || client.roomId !== roomId) {
            console.warn(`Client ID mismatch for ${clientId}`);
            return;
        }

        // Use type guards for different events
        switch (event) {
            case 'init': {
                // Only re-register if something changed
                this.registerClient(client.socket, userId, roomId);
                break;
            }

            case SocketEvent.KICK_USER: {
                // Validate payload type
                if (typeof payload !== 'string') {
                    console.error('Invalid payload for KICK_USER event, expected string');
                    return;
                }
                await this.kickUser(roomId, userId, payload);
                break;
            }

            case SocketEvent.LEAVE_ROOM:
                await this.handleUserLeave(roomId, userId);
                break;

            case SocketEvent.SUBMIT_VOTE: {
                // Validate payload type
                if (payload !== null && typeof payload !== 'number') {
                    console.error('Invalid payload for SUBMIT_VOTE event, expected number or null');
                    return;
                }
                await this.submitVote(roomId, userId, payload);
                break;
            }

            case SocketEvent.REVEAL_VOTES: {
                // Validate payload type
                if (typeof payload !== 'boolean') {
                    console.error('Invalid payload for REVEAL_VOTES event, expected boolean');
                    return;
                }
                await this.revealVotes(roomId, userId, payload);
                break;
            }

            case SocketEvent.RESET_VOTES:
                await this.resetVotes(roomId, userId);
                break;

            case SocketEvent.ISSUE_UPDATED: {
                // Validate payload type
                if (typeof payload !== 'string') {
                    console.error('Invalid payload for ISSUE_UPDATED event, expected string');
                    return;
                }
                await this.updateIssue(roomId, userId, payload);
                break;
            }

            default:
                console.warn(`Unknown event type: ${event}`);
        }
    }

    // Handle a user leaving a room
    async handleUserLeave(roomId: string, userId: string): Promise<void> {
        try {
            console.log(`User ${userId} leaving room ${roomId}`);

            // Remove from database
            await roomUserDB.removeUserFromRoom(roomId, userId);

            // Remove from clients list
            const clientId = `${userId}-${roomId}`;
            this.clients.delete(clientId);

            // Notify other users
            this.broadcastToRoom(roomId, {
                event: SocketEvent.USER_LEFT,
                userId,
                roomId,
                payload: userId
            });

            // Check if room has any users left
            const roomUsers = await roomDB.getUsers(roomId);
            console.log(`Room ${roomId} has ${roomUsers.length} users left`);

            if (roomUsers.length === 0) {
                // No users left, clean up room state
                this.roomStates.delete(roomId);
                console.log(`Deleted room state for empty room ${roomId}`);
            } else {
                // Room still has users, check if host left
                const room = await roomDB.findById(roomId);
                if (room && room.host_id === userId && roomUsers.length > 0) {
                    // Host left, assign new host
                    const newHostId = roomUsers[0].id;
                    await roomDB.update(roomId, { hostId: newHostId });
                    console.log(`Host changed in room ${roomId} from ${userId} to ${newHostId}`);

                    // Notify about host change
                    this.broadcastToRoom(roomId, {
                        event: SocketEvent.HOST_CHANGED,
                        userId,
                        roomId,
                        payload: newHostId
                    });
                }
            }
        } catch (error) {
            console.error(`Error handling user leave: ${error}`);
        }
    }

    // Handle a host kicking a user
    async kickUser(roomId: string, hostId: string, targetUserId: string): Promise<void> {
        try {
            // Verify host
            const room = await roomDB.findById(roomId);
            if (!room || room.host_id !== hostId) {
                console.warn(`Unauthorized kick attempt by non-host user: ${hostId}`);
                return;
            }

            // Remove user from room
            await roomUserDB.removeUserFromRoom(roomId, targetUserId);

            // Notify the kicked user
            const kickedClientId = `${targetUserId}-${roomId}`;
            const kickedClient = this.clients.get(kickedClientId);
            if (kickedClient) {
                kickedClient.socket.send(JSON.stringify({
                    event: SocketEvent.KICKED,
                    payload: null
                }));

                // Remove from clients list
                this.clients.delete(kickedClientId);
            }

            // Notify other users
            this.broadcastToRoom(roomId, {
                event: SocketEvent.USER_LEFT,
                userId: hostId,
                roomId,
                payload: targetUserId
            });
        } catch (error) {
            console.error(`Error kicking user: ${error}`);
        }
    }

    // Handle vote submission
    async submitVote(roomId: string, userId: string, value: number | null): Promise<void> {
        console.log(`Vote received from ${userId} in room ${roomId}: ${value}`);

        // Ensure room state exists
        let roomState = this.roomStates.get(roomId);
        if (!roomState) {
            console.log(`Room state not found for ${roomId}, initializing...`);
            await this.initializeRoomState(roomId);
            roomState = this.roomStates.get(roomId);

            if (!roomState) {
                console.error(`Failed to initialize room state for ${roomId}`);
                return;
            }
        }

        // Don't allow voting if votes are revealed
        if (roomState.isRevealed) {
            console.log(`Votes already revealed in room ${roomId}, rejecting vote`);
            return;
        }

        try {
            // Store vote in database
            console.log(`Storing vote in database: ${userId}, ${value}`);
            await voteDB.submitVote(roomId, userId, value);

            // Update local state
            roomState.votes[userId] = { userId, value };
            console.log(`Updated local vote state for ${userId}: ${value}`);

            // Broadcast updated votes to all clients
            console.log(`Broadcasting votes update to room ${roomId}`);
            this.broadcastToRoom(roomId, {
                event: SocketEvent.VOTES_UPDATED,
                userId,
                roomId,
                payload: roomState.votes
            });

            // Send confirmation directly to voting user
            this.sendToClient(userId, roomId, {
                event: 'vote-confirmed',
                userId,
                roomId,
                payload: { value }
            });
        } catch (error) {
            console.error(`Error processing vote: ${error}`);

            // Send error back to client
            this.sendToClient(userId, roomId, {
                event: 'error',
                userId,
                roomId,
                payload: { message: 'Vote processing failed', error: String(error) }
            });
        }
    }

    sendToClient(userId: string, roomId: string, message: any): void {
        const clientId = `${userId}-${roomId}`;
        const client = this.clients.get(clientId);

        if (client && client.socket.readyState === WebSocket.OPEN) {
            try {
                client.socket.send(JSON.stringify(message));
            } catch (error) {
                console.error(`Error sending to client ${clientId}:`, error);
            }
        } else {
            console.warn(`Cannot send to client ${clientId}: not found or socket not open`);
        }
    }

    // Handle vote reveal
    async revealVotes(roomId: string, userId: string, reveal: boolean): Promise<void> {
        const roomState = this.roomStates.get(roomId);
        if (!roomState) return;

        try {
            // Verify host
            const room = await roomDB.findById(roomId);
            if (!room || room.host_id !== userId) {
                console.warn(`Unauthorized reveal attempt by non-host user: ${userId}`);
                return;
            }

            // Update state
            roomState.isRevealed = reveal;

            // Broadcast reveal status
            this.broadcastToRoom(roomId, {
                event: SocketEvent.REVEAL_VOTES,
                userId,
                roomId,
                payload: reveal
            });
        } catch (error) {
            console.error(`Error revealing votes: ${error}`);
        }
    }

    // Handle vote reset
    async resetVotes(roomId: string, userId: string): Promise<void> {
        const roomState = this.roomStates.get(roomId);
        if (!roomState) return;

        try {
            // Verify host
            const room = await roomDB.findById(roomId);
            if (!room || room.host_id !== userId) {
                console.warn(`Unauthorized reset attempt by non-host user: ${userId}`);
                return;
            }

            // Reset votes in database
            await voteDB.resetRoomVotes(roomId);

            // Reset local state
            roomState.votes = {};
            roomState.isRevealed = false;

            // Broadcast reset
            this.broadcastToRoom(roomId, {
                event: SocketEvent.RESET_VOTES,
                userId,
                roomId,
                payload: null
            });
        } catch (error) {
            console.error(`Error resetting votes: ${error}`);
        }
    }

    // Handle issue update
    async updateIssue(roomId: string, userId: string, issue: string): Promise<void> {
        const roomState = this.roomStates.get(roomId);
        if (!roomState) return;

        try {
            // Verify host
            const room = await roomDB.findById(roomId);
            if (!room || room.host_id !== userId) {
                console.warn(`Unauthorized issue update attempt by non-host user: ${userId}`);
                return;
            }

            // Store issue in database
            await issueDB.create(roomId, issue);

            // Update local state
            roomState.currentIssue = issue;

            // Broadcast issue update
            this.broadcastToRoom(roomId, {
                event: SocketEvent.ISSUE_UPDATED,
                userId,
                roomId,
                payload: issue
            });
        } catch (error) {
            console.error(`Error updating issue: ${error}`);
        }
    }

    // Broadcast a message to all clients in a room
    broadcastToRoom(roomId: string, message: SocketMessage): void {
        console.log(`Broadcasting ${message.event} to room ${roomId}`);

        let deliveredCount = 0;
        const clientsToRemove: string[] = [];

        for (const [clientId, client] of this.clients.entries()) {
            if (client.roomId === roomId) {
                try {
                    if (client.socket.readyState === WebSocket.OPEN) {
                        client.socket.send(JSON.stringify(message));
                        deliveredCount++;
                    } else {
                        console.warn(`Cannot send to client ${clientId}: Socket not open`);
                        clientsToRemove.push(clientId);
                    }
                } catch (error) {
                    console.error(`Error sending to client ${clientId}: ${error}`);
                    clientsToRemove.push(clientId);
                }
            }
        }

        // Clean up disconnected clients
        clientsToRemove.forEach(clientId => {
            this.clients.delete(clientId);
        });

        console.log(`Broadcast complete: delivered to ${deliveredCount} clients`);
    }

    // Handle client disconnection
    handleDisconnect(socket: WebSocket): void {
        // Find all clients with this socket
        const clientsToRemove: string[] = [];
        const clientsToHandleLeave: { clientId: string, userId: string, roomId: string }[] = [];

        for (const [clientId, client] of this.clients.entries()) {
            if (client.socket === socket) {
                console.log(`Client disconnected: ${clientId}`);
                clientsToRemove.push(clientId);
                clientsToHandleLeave.push({
                    clientId,
                    userId: client.userId,
                    roomId: client.roomId
                });
            }
        }

        // Remove clients
        clientsToRemove.forEach(clientId => {
            this.clients.delete(clientId);
        });

        // Handle user leave for each client
        clientsToHandleLeave.forEach(({ userId, roomId }) => {
            this.handleUserLeave(roomId, userId).catch(error => {
                console.error(`Error handling disconnection for user ${userId} in room ${roomId}:`, error);
            });
        });
    }
}

// Singleton instance
export const roomManager = new RoomManager();
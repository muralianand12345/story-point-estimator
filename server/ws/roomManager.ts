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
        this.clients.set(clientId, { socket, userId, roomId });

        console.log(`Client registered: ${clientId}`);

        // Initialize room state if not exists
        if (!this.roomStates.has(roomId)) {
            this.initializeRoomState(roomId);
        }

        // Notify room about new user
        this.broadcastToRoom(roomId, {
            event: SocketEvent.USER_JOINED,
            userId,
            roomId,
            payload: userId
        });
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
        if (!client) return;

        const { event, userId, roomId, payload } = message;
        console.log(`Received event: ${event} from user: ${userId} in room: ${roomId}`);

        // Use type guards for different events
        switch (event) {
            case 'init': {
                // Client is sending initialization data
                this.registerClient(client.socket, userId, roomId);

                // Send current state to the client
                const roomState = this.roomStates.get(roomId);
                if (roomState) {
                    client.socket.send(JSON.stringify({
                        event: SocketEvent.VOTES_UPDATED,
                        payload: roomState.votes
                    }));

                    client.socket.send(JSON.stringify({
                        event: SocketEvent.REVEAL_VOTES,
                        payload: roomState.isRevealed
                    }));

                    if (roomState.currentIssue) {
                        client.socket.send(JSON.stringify({
                            event: SocketEvent.ISSUE_UPDATED,
                            payload: roomState.currentIssue
                        }));
                    }
                }
                break;
            }

            case SocketEvent.KICK_USER: {
                // Type check for kick user payload (should be a string ID)
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
                // Type check - payload should be number or null
                if (payload !== null && typeof payload !== 'number') {
                    console.error('Invalid payload for SUBMIT_VOTE event, expected number or null');
                    return;
                }
                await this.submitVote(roomId, userId, payload);
                break;
            }

            case SocketEvent.REVEAL_VOTES: {
                // Type check - payload should be boolean
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
                // Type check - payload should be string
                if (typeof payload !== 'string') {
                    console.error('Invalid payload for ISSUE_UPDATED event, expected string');
                    return;
                }
                await this.updateIssue(roomId, userId, payload);
                break;
            }
        }
    }

    // Handle a user leaving a room
    async handleUserLeave(roomId: string, userId: string): Promise<void> {
        try {
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
            if (roomUsers.length === 0) {
                // No users left, clean up room state
                this.roomStates.delete(roomId);
            } else {
                // Room still has users, check if host left
                const room = await roomDB.findById(roomId);
                if (room && room.host_id === userId && roomUsers.length > 0) {
                    // Host left, assign new host
                    const newHostId = roomUsers[0].id;
                    await roomDB.update(roomId, { hostId: newHostId });

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
        const roomState = this.roomStates.get(roomId);
        if (!roomState) return;

        // Don't allow voting if votes are revealed
        if (roomState.isRevealed) return;

        try {
            // Store vote in database
            await voteDB.submitVote(roomId, userId, value);

            // Update local state
            roomState.votes[userId] = { userId, value };

            // Broadcast updated votes
            this.broadcastToRoom(roomId, {
                event: SocketEvent.VOTES_UPDATED,
                userId,
                roomId,
                payload: roomState.votes
            });
        } catch (error) {
            console.error(`Error submitting vote: ${error}`);
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
        for (const [clientId, client] of this.clients.entries()) {
            if (client.roomId === roomId) {
                try {
                    client.socket.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`Error sending to client ${clientId}: ${error}`);
                    this.clients.delete(clientId);
                }
            }
        }
    }

    // Handle client disconnection
    handleDisconnect(socket: WebSocket): void {
        // Find the client with this socket
        for (const [clientId, client] of this.clients.entries()) {
            if (client.socket === socket) {
                const { userId, roomId } = client;
                console.log(`Client disconnected: ${clientId}`);

                // Handle user leave
                this.handleUserLeave(roomId, userId);

                // Remove from clients list
                this.clients.delete(clientId);
                break;
            }
        }
    }
}

// Singleton instance
export const roomManager = new RoomManager();
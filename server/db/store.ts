import { Room, User, VoteHistory } from "../types/room.ts";
import { v4 as uuidv4 } from "uuid";
import { getRoom, storeRoom, cleanupOldRooms as dbCleanupOldRooms } from "./database.ts";

// Room store using in-memory database with JSON persistence
class RoomStore {
    // Create a new room
    public createRoom(issueName: string = "Untitled Story"): Room {
        const roomId = uuidv4().substring(0, 8);
        const now = Date.now();

        const room: Room = {
            id: roomId,
            hostId: "",
            issueName: issueName,
            users: [],
            votingEnabled: true,
            votesRevealed: false,
            voteHistory: [],
            createdAt: now,
            lastActivity: now,
        };

        storeRoom(room);
        return room;
    }

    // Get a room by ID
    public getRoom(roomId: string): Room | undefined {
        return getRoom(roomId);
    }

    // Update a room's timestamp
    private updateRoomTimestamp(room: Room): void {
        room.lastActivity = Date.now();
        storeRoom(room);
    }

    // Add a user to a room
    public addUserToRoom(roomId: string, user: User): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        // If this is the first user, make them the host
        if (room.users.length === 0) {
            user.isHost = true;
            room.hostId = user.id;
        }

        // Add or update user
        const existingUserIndex = room.users.findIndex(u => u.id === user.id);
        if (existingUserIndex >= 0) {
            room.users[existingUserIndex] = user;
        } else {
            room.users.push(user);
        }

        this.updateRoomTimestamp(room);
        return room;
    }

    // Remove a user from a room
    public removeUserFromRoom(roomId: string, userId: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        const userIndex = room.users.findIndex((u) => u.id === userId);
        if (userIndex === -1) return room;

        // Check if user is host
        const isHost = room.users[userIndex].isHost;

        // Remove the user
        room.users.splice(userIndex, 1);

        // Transfer host if necessary
        if (isHost && room.users.length > 0) {
            const nextUser = room.users[0];
            nextUser.isHost = true;
            room.hostId = nextUser.id;
        }

        this.updateRoomTimestamp(room);
        return room;
    }

    // Update a user's vote
    public updateUserVote(roomId: string, userId: string, vote: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        const user = room.users.find((u) => u.id === userId);
        if (!user) return room;

        user.vote = vote;

        this.updateRoomTimestamp(room);
        return room;
    }

    // Reveal votes in a room
    public revealVotes(roomId: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        // Update room state
        room.votesRevealed = true;

        // Add to vote history
        const historyId = uuidv4();
        const now = Date.now();

        const voteHistory: VoteHistory = {
            id: historyId,
            issueName: room.issueName,
            votes: room.users
                .filter(user => user.vote !== null)
                .map(user => ({
                    userId: user.id,
                    userName: user.name,
                    vote: user.vote as string,
                })),
            timestamp: now,
        };

        room.voteHistory.push(voteHistory);

        this.updateRoomTimestamp(room);
        return room;
    }

    // Reset votes in a room
    public resetVotes(roomId: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        // Reset all votes
        room.users.forEach(user => {
            user.vote = null;
        });

        room.votesRevealed = false;

        this.updateRoomTimestamp(room);
        return room;
    }

    // Update issue name
    public updateIssueName(roomId: string, issueName: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        room.issueName = issueName;

        this.updateRoomTimestamp(room);
        return room;
    }

    // Clean up old rooms
    public cleanupOldRooms(maxAgeMs: number): void {
        try {
            dbCleanupOldRooms(maxAgeMs);
        } catch (error) {
            console.error("Error cleaning up old rooms:", error);
        }
    }
}

// Create and export singleton instance
export const roomStore = new RoomStore();
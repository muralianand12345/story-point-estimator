import { Room, User } from "../types/room.ts";
import { v4 as uuidv4 } from "uuid";

// In-memory data store for rooms
class RoomStore {
    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map<string, Room>();
    }

    // Create a new room
    public createRoom(): Room {
        const roomId = uuidv4().substring(0, 8);

        const room: Room = {
            id: roomId,
            hostId: "",
            issueName: "Untitled Story",
            users: [],
            votingEnabled: true,
            votesRevealed: false,
            voteHistory: [],
            createdAt: Date.now(),
            lastActivity: Date.now()
        };

        this.rooms.set(roomId, room);
        return room;
    }

    // Get a room by ID
    public getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    // Update a room
    public updateRoom(room: Room): Room {
        room.lastActivity = Date.now();
        this.rooms.set(room.id, room);
        return room;
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

        room.users.push(user);
        this.updateRoom(room);

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
            // Transfer host to the next user who joined
            room.users[0].isHost = true;
            room.hostId = room.users[0].id;
        }

        this.updateRoom(room);

        // If no users left, consider cleaning up the room later
        if (room.users.length === 0) {
            // For now, we'll keep the room around, but we could implement
            // a cleanup mechanism after a certain period of inactivity
        }

        return room;
    }

    // Update a user's vote
    public updateUserVote(roomId: string, userId: string, vote: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        const user = room.users.find((u) => u.id === userId);
        if (!user) return room;

        user.vote = vote;
        this.updateRoom(room);

        return room;
    }

    // Reveal votes in a room
    public revealVotes(roomId: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        room.votesRevealed = true;

        // Add to vote history
        const voteHistory = {
            id: uuidv4(),
            issueName: room.issueName,
            votes: room.users.filter(u => u.vote !== null).map(u => ({
                userId: u.id,
                userName: u.name,
                vote: u.vote as string
            })),
            timestamp: Date.now()
        };

        room.voteHistory.push(voteHistory);
        this.updateRoom(room);

        return room;
    }

    // Reset votes in a room
    public resetVotes(roomId: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        room.users.forEach(user => {
            user.vote = null;
        });

        room.votesRevealed = false;
        this.updateRoom(room);

        return room;
    }

    // Update issue name
    public updateIssueName(roomId: string, issueName: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        room.issueName = issueName;
        this.updateRoom(room);

        return room;
    }

    // Clean up old rooms (call this periodically)
    public cleanupOldRooms(maxAgeMs: number): void {
        const now = Date.now();
        const roomsToDelete: string[] = [];

        this.rooms.forEach((room, roomId) => {
            if (now - room.lastActivity > maxAgeMs) {
                roomsToDelete.push(roomId);
            }
        });

        roomsToDelete.forEach(roomId => {
            this.rooms.delete(roomId);
        });
    }

    // Get all rooms (mainly for debugging)
    public getAllRooms(): Room[] {
        return Array.from(this.rooms.values());
    }
}

// Create and export singleton instance
export const roomStore = new RoomStore();
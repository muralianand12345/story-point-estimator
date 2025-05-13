// server/db/store.ts
import { Room, User, VoteHistory } from "../types/room.ts";
import { v4 as uuidv4 } from "uuid";
import { db } from "./database.ts";

// Define types for database rows
interface RoomRow {
    id: string;
    hostId: string;
    issueName: string;
    votingEnabled: number;
    votesRevealed: number;
    createdAt: number;
    lastActivity: number;
}

interface UserRow {
    id: string;
    roomId: string;
    name: string;
    isHost: number;
    vote: string | null;
}

interface VoteHistoryRow {
    id: string;
    roomId: string;
    issueName: string;
    finalScore: string | null;
    timestamp: number;
}

interface VoteDetailRow {
    historyId: string;
    userId: string;
    userName: string;
    vote: string;
}

// SQLite-based room store
class RoomStore {
    // Create a new room
    public createRoom(): Room {
        const roomId = uuidv4().substring(0, 8);
        const now = Date.now();

        const room: Room = {
            id: roomId,
            hostId: "",
            issueName: "Untitled Story",
            users: [],
            votingEnabled: true,
            votesRevealed: false,
            voteHistory: [],
            createdAt: now,
            lastActivity: now,
        };

        db.query<never>(
            `INSERT INTO rooms (id, hostId, issueName, votingEnabled, votesRevealed, createdAt, lastActivity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                roomId,
                "",
                "Untitled Story",
                1,
                0,
                now,
                now,
            ]
        );

        return room;
    }

    // Get a room by ID
    public getRoom(roomId: string): Room | undefined {
        const roomRows = [...db.query<[
            string, string, string, number, number, number, number
        ]>(
            `SELECT id, hostId, issueName, votingEnabled, votesRevealed, createdAt, lastActivity 
       FROM rooms WHERE id = ?`,
            [roomId]
        )];

        if (roomRows.length === 0) {
            return undefined;
        }

        const roomRow = roomRows[0];

        // Get users
        const usersRows = [...db.query<[
            string, string, string, number, string | null
        ]>(
            `SELECT id, roomId, name, isHost, vote FROM users WHERE roomId = ?`,
            [roomId]
        )];

        const users: User[] = usersRows.map((row) => ({
            id: row[0],
            name: row[2],
            isHost: Boolean(row[3]),
            vote: row[4],
        }));

        // Get vote history
        const historyRows = [...db.query<[
            string, string, string, string | null, number
        ]>(
            `SELECT id, roomId, issueName, finalScore, timestamp 
       FROM vote_history WHERE roomId = ? ORDER BY timestamp DESC`,
            [roomId]
        )];

        const voteHistory: VoteHistory[] = [];

        for (const historyRow of historyRows) {
            const historyId = historyRow[0];

            const voteDetails = [...db.query<[
                string, string, string, string
            ]>(
                `SELECT historyId, userId, userName, vote FROM vote_details WHERE historyId = ?`,
                [historyId]
            )];

            voteHistory.push({
                id: historyId,
                issueName: historyRow[2],
                votes: voteDetails.map((vote) => ({
                    userId: vote[1],
                    userName: vote[2],
                    vote: vote[3],
                })),
                finalScore: historyRow[3] ?? undefined,
                timestamp: historyRow[4],
            });
        }

        return {
            id: roomRow[0],
            hostId: roomRow[1],
            issueName: roomRow[2],
            users,
            votingEnabled: Boolean(roomRow[3]),
            votesRevealed: Boolean(roomRow[4]),
            voteHistory,
            createdAt: roomRow[5],
            lastActivity: roomRow[6],
        };
    }

    // Update a room's timestamp
    private updateRoomTimestamp(roomId: string): void {
        const now = Date.now();
        db.query<never>(
            `UPDATE rooms SET lastActivity = ? WHERE id = ?`,
            [now, roomId]
        );
    }

    // Add a user to a room
    public addUserToRoom(roomId: string, user: User): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        // If this is the first user, make them the host
        if (room.users.length === 0) {
            user.isHost = true;
            room.hostId = user.id;

            // Update room's hostId
            db.query<never>(
                `UPDATE rooms SET hostId = ? WHERE id = ?`,
                [user.id, roomId]
            );
        }

        // Add user to the database
        db.query<never>(
            `INSERT OR REPLACE INTO users (id, roomId, name, isHost, vote)
       VALUES (?, ?, ?, ?, ?)`,
            [
                user.id,
                roomId,
                user.name,
                user.isHost ? 1 : 0,
                user.vote,
            ]
        );

        this.updateRoomTimestamp(roomId);
        return this.getRoom(roomId);
    }

    // Remove a user from a room
    public removeUserFromRoom(roomId: string, userId: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        const userIndex = room.users.findIndex((u) => u.id === userId);
        if (userIndex === -1) return room;

        // Check if user is host
        const isHost = room.users[userIndex].isHost;

        // Remove the user from the database
        db.query<never>(
            `DELETE FROM users WHERE id = ? AND roomId = ?`,
            [userId, roomId]
        );

        // Transfer host if necessary
        if (isHost && room.users.length > 1) {
            // Transfer host to the next user who joined
            const nextHostId = room.users.find(u => u.id !== userId)?.id;
            if (nextHostId) {
                db.query<never>(
                    `UPDATE users SET isHost = 1 WHERE id = ? AND roomId = ?`,
                    [nextHostId, roomId]
                );

                db.query<never>(
                    `UPDATE rooms SET hostId = ? WHERE id = ?`,
                    [nextHostId, roomId]
                );
            }
        }

        this.updateRoomTimestamp(roomId);
        return this.getRoom(roomId);
    }

    // Update a user's vote
    public updateUserVote(roomId: string, userId: string, vote: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        const user = room.users.find((u) => u.id === userId);
        if (!user) return room;

        db.query<never>(
            `UPDATE users SET vote = ? WHERE id = ? AND roomId = ?`,
            [vote, userId, roomId]
        );

        this.updateRoomTimestamp(roomId);
        return this.getRoom(roomId);
    }

    // Reveal votes in a room
    public revealVotes(roomId: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        // Update room state
        db.query<never>(
            `UPDATE rooms SET votesRevealed = 1 WHERE id = ?`,
            [roomId]
        );

        // Add to vote history
        const historyId = uuidv4();
        const now = Date.now();

        db.query<never>(
            `INSERT INTO vote_history (id, roomId, issueName, timestamp)
       VALUES (?, ?, ?, ?)`,
            [historyId, roomId, room.issueName, now]
        );

        // Add vote details
        for (const user of room.users) {
            if (user.vote !== null) {
                db.query<never>(
                    `INSERT INTO vote_details (historyId, userId, userName, vote)
           VALUES (?, ?, ?, ?)`,
                    [historyId, user.id, user.name, user.vote]
                );
            }
        }

        this.updateRoomTimestamp(roomId);
        return this.getRoom(roomId);
    }

    // Reset votes in a room
    public resetVotes(roomId: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        db.query<never>(
            `UPDATE users SET vote = NULL WHERE roomId = ?`,
            [roomId]
        );

        db.query<never>(
            `UPDATE rooms SET votesRevealed = 0 WHERE id = ?`,
            [roomId]
        );

        this.updateRoomTimestamp(roomId);
        return this.getRoom(roomId);
    }

    // Update issue name
    public updateIssueName(roomId: string, issueName: string): Room | undefined {
        const room = this.getRoom(roomId);
        if (!room) return undefined;

        db.query<never>(
            `UPDATE rooms SET issueName = ? WHERE id = ?`,
            [issueName, roomId]
        );

        this.updateRoomTimestamp(roomId);
        return this.getRoom(roomId);
    }

    // Clean up old rooms
    public cleanupOldRooms(maxAgeMs: number): void {
        const now = Date.now();
        const cutoffTime = now - maxAgeMs;

        db.query<never>(
            `DELETE FROM rooms WHERE lastActivity < ?`,
            [cutoffTime]
        );
    }
}

// Create and export singleton instance
export const roomStore = new RoomStore();
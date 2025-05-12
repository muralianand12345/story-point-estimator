import { db } from "./client.ts";
import { User, Room, RoomUser, VoteRecord, Issue } from "../models/types.ts";

// User operations
export const userDB = {
    async create(name: string): Promise<User> {
        const result = await db.query<User>(
            "INSERT INTO users (name) VALUES ($1) RETURNING id, name, created_at",
            [name]
        );

        if (result.rows.length === 0) {
            throw new Error("Failed to create user");
        }

        return result.rows[0];
    },

    async findById(id: string): Promise<User | null> {
        const result = await db.query<User>(
            "SELECT id, name, created_at FROM users WHERE id = $1",
            [id]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    }
};

// Room operations
export const roomDB = {
    async create(name: string, roomCode: string, hostId: string): Promise<Room> {
        const result = await db.query<Room>(
            "INSERT INTO rooms (name, room_code, host_id) VALUES ($1, $2, $3) RETURNING id, name, room_code, host_id, is_active, created_at",
            [name, roomCode, hostId]
        );

        if (result.rows.length === 0) {
            throw new Error("Failed to create room");
        }

        return result.rows[0];
    },

    async findById(id: string): Promise<Room | null> {
        const result = await db.query<Room>(
            "SELECT id, name, room_code, host_id, is_active, created_at FROM rooms WHERE id = $1",
            [id]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    },

    async findByCode(code: string): Promise<Room | null> {
        const result = await db.query<Room>(
            "SELECT id, name, room_code, host_id, is_active, created_at FROM rooms WHERE room_code = $1 AND is_active = true",
            [code]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    },

    async update(id: string, updates: { hostId?: string; isActive?: boolean }): Promise<Room | null> {
        const setClause: string[] = [];
        const values: unknown[] = [id];
        let paramIndex = 2;

        if (updates.hostId !== undefined) {
            setClause.push(`host_id = $${paramIndex++}`);
            values.push(updates.hostId);
        }

        if (updates.isActive !== undefined) {
            setClause.push(`is_active = $${paramIndex++}`);
            values.push(updates.isActive);
        }

        if (setClause.length === 0) {
            return null;
        }

        const result = await db.query<Room>(
            `UPDATE rooms SET ${setClause.join(", ")} WHERE id = $1 RETURNING id, name, room_code, host_id, is_active, created_at`,
            values
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    },

    async getUsers(roomId: string): Promise<User[]> {
        const result = await db.query<User>(
            `SELECT u.id, u.name, u.created_at 
       FROM users u
       JOIN room_users ru ON u.id = ru.user_id
       WHERE ru.room_id = $1`,
            [roomId]
        );

        return result.rows;
    },

    async generateUniqueCode(): Promise<string> {
        const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters
        const codeLength = 6;

        while (true) {
            let code = "";
            for (let i = 0; i < codeLength; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                code += characters.charAt(randomIndex);
            }

            // Check if code already exists
            const existingRoom = await roomDB.findByCode(code);
            if (!existingRoom) {
                return code;
            }
        }
    }
};

// Room-User operations
export const roomUserDB = {
    async addUserToRoom(roomId: string, userId: string): Promise<RoomUser> {
        try {
            const result = await db.query<RoomUser>(
                "INSERT INTO room_users (room_id, user_id) VALUES ($1, $2) RETURNING room_id, user_id, joined_at",
                [roomId, userId]
            );

            if (result.rows.length === 0) {
                throw new Error("Failed to add user to room");
            }

            return result.rows[0];
        } catch (error) {
            // If user is already in room, just return the existing record
            if (error.message.includes("duplicate key")) {
                const result = await db.query<RoomUser>(
                    "SELECT room_id, user_id, joined_at FROM room_users WHERE room_id = $1 AND user_id = $2",
                    [roomId, userId]
                );

                if (result.rows.length === 0) {
                    throw new Error("Failed to get room user record");
                }

                return result.rows[0];
            }
            throw error;
        }
    },

    async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
        await db.query(
            "DELETE FROM room_users WHERE room_id = $1 AND user_id = $2",
            [roomId, userId]
        );
    },

    async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
        const result = await db.query(
            "SELECT 1 FROM room_users WHERE room_id = $1 AND user_id = $2",
            [roomId, userId]
        );
        return result.rows.length > 0;
    }
};

// Vote operations
export const voteDB = {
    async submitVote(roomId: string, userId: string, value: number | null): Promise<VoteRecord> {
        try {
            const result = await db.query<VoteRecord>(
                `INSERT INTO votes (room_id, user_id, value) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (room_id, user_id) 
         DO UPDATE SET value = $3
         RETURNING id, room_id, user_id, value, created_at`,
                [roomId, userId, value]
            );

            if (result.rows.length === 0) {
                throw new Error("Failed to submit vote");
            }

            return result.rows[0];
        } catch (error) {
            console.error("Error submitting vote:", error);
            throw error;
        }
    },

    async getRoomVotes(roomId: string): Promise<VoteRecord[]> {
        const result = await db.query<VoteRecord>(
            "SELECT id, room_id, user_id, value, created_at FROM votes WHERE room_id = $1",
            [roomId]
        );

        return result.rows;
    },

    async resetRoomVotes(roomId: string): Promise<void> {
        await db.query(
            "DELETE FROM votes WHERE room_id = $1",
            [roomId]
        );
    }
};

// Issue operations
export const issueDB = {
    async create(roomId: string, title: string): Promise<Issue> {
        const result = await db.query<Issue>(
            "INSERT INTO issues (room_id, title) VALUES ($1, $2) RETURNING id, room_id, title, created_at",
            [roomId, title]
        );

        if (result.rows.length === 0) {
            throw new Error("Failed to create issue");
        }

        return result.rows[0];
    },

    async getCurrentIssue(roomId: string): Promise<Issue | null> {
        const result = await db.query<Issue>(
            "SELECT id, room_id, title, created_at FROM issues WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1",
            [roomId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    }
};
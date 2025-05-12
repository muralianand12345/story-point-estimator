import { Pool } from "../../deps.ts";
import { Room, User } from "../types/index.ts";
import { getEnv } from "../utils/env.ts";

// Function to create database connection pool
export function createDatabasePool(): Pool | null {
    try {
        // Get connection string from environment variables
        const connectionString = getEnv("DATABASE_URL");

        // Log connection attempt (without showing sensitive details)
        console.log("Connecting to PostgreSQL database...");

        // Check if connection string is provided
        if (!connectionString) {
            console.warn("Missing database connection string");
            console.warn("Please set the DATABASE_URL environment variable");
            return null;
        }

        // Create connection pool
        return new Pool(connectionString, 10);
    } catch (error) {
        console.error("Failed to create database connection pool:", error);
        return null;
    }
}

// Database wrapper with methods for all required operations
export class DB {
    private pool: Pool | null;

    constructor() {
        this.pool = createDatabasePool();

        if (!this.pool) {
            console.warn("Database connection pool not initialized. DB operations will fail.");
        }
    }

    private async getClient() {
        if (!this.pool) {
            throw new Error("Database connection pool not initialized");
        }
        return await this.pool.connect();
    }

    // Room related operations
    async findRoomById(roomId: string): Promise<Room | null> {
        try {
            const client = await this.getClient();
            try {
                const result = await client.queryObject<Room>`
          SELECT * FROM rooms
          WHERE id = ${roomId} AND is_active = true
        `;
                return result.rows[0] || null;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error finding room ${roomId}:`, error);
            return null;
        }
    }

    async findRoomByCode(code: string): Promise<Room | null> {
        try {
            const client = await this.getClient();
            try {
                const result = await client.queryObject<Room>`
          SELECT * FROM rooms
          WHERE room_code = ${code.toUpperCase()} AND is_active = true
        `;
                return result.rows[0] || null;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error finding room by code ${code}:`, error);
            return null;
        }
    }

    async updateRoomHost(roomId: string, newHostId: string): Promise<void> {
        try {
            const client = await this.getClient();
            try {
                await client.queryObject`
          UPDATE rooms
          SET host_id = ${newHostId}
          WHERE id = ${roomId}
        `;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error updating room host for room ${roomId}:`, error);
        }
    }

    async deactivateRoom(roomId: string): Promise<void> {
        try {
            const client = await this.getClient();
            try {
                await client.queryObject`
          UPDATE rooms
          SET is_active = false
          WHERE id = ${roomId}
        `;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error deactivating room ${roomId}:`, error);
        }
    }

    // User related operations
    async findUserById(userId: string): Promise<User | null> {
        try {
            const client = await this.getClient();
            try {
                const result = await client.queryObject<User>`
          SELECT * FROM users
          WHERE id = ${userId}
        `;
                return result.rows[0] || null;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error finding user ${userId}:`, error);
            return null;
        }
    }

    // RoomUser related operations
    async findRoomUsers(roomId: string): Promise<User[]> {
        try {
            const client = await this.getClient();
            try {
                const result = await client.queryObject<User>`
          SELECT u.* FROM users u
          JOIN room_users ru ON u.id = ru.user_id
          WHERE ru.room_id = ${roomId}
          ORDER BY ru.joined_at ASC
        `;
                return result.rows;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error finding users for room ${roomId}:`, error);
            return [];
        }
    }

    async findNextHost(roomId: string, excludeUserId: string): Promise<string | null> {
        try {
            const client = await this.getClient();
            try {
                const result = await client.queryObject<{ user_id: string }>`
          SELECT user_id FROM room_users
          WHERE room_id = ${roomId} AND user_id != ${excludeUserId}
          ORDER BY joined_at ASC
          LIMIT 1
        `;
                return result.rows[0]?.user_id || null;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error finding next host for room ${roomId}:`, error);
            return null;
        }
    }

    async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
        try {
            const client = await this.getClient();
            try {
                await client.queryObject`
          DELETE FROM room_users
          WHERE room_id = ${roomId} AND user_id = ${userId}
        `;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error removing user ${userId} from room ${roomId}:`, error);
        }
    }

    async deleteUser(userId: string): Promise<void> {
        try {
            const client = await this.getClient();
            try {
                await client.queryObject`
          DELETE FROM users
          WHERE id = ${userId}
        `;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error);
        }
    }

    async userExistsInRoom(roomId: string, userId: string): Promise<boolean> {
        try {
            const client = await this.getClient();
            try {
                const result = await client.queryObject<{ exists: boolean }>`
          SELECT EXISTS(
            SELECT 1 FROM room_users
            WHERE room_id = ${roomId} AND user_id = ${userId}
          ) as exists
        `;
                return result.rows[0]?.exists || false;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`Error checking if user ${userId} exists in room ${roomId}:`, error);
            return false;
        }
    }
}

// Create a singleton instance
export const db = new DB();
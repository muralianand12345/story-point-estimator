import { Room } from "../types/room.ts";
import { join } from "https://deno.land/std@0.200.0/path/mod.ts";

// Get the current working directory
const cwd = Deno.cwd();

// Path for the JSON database file
const DB_PATH = join(cwd, "rooms.json");  // Simplified path
console.log(`Using database at: ${DB_PATH}`);

// In-memory database
export let roomsDatabase: Record<string, Room> = {};

// Initialize the database
export function initializeDatabase(): void {
    try {
        // Check if the database file exists
        try {
            const fileContent = Deno.readTextFileSync(DB_PATH);
            roomsDatabase = JSON.parse(fileContent);
            console.log(`Loaded ${Object.keys(roomsDatabase).length} rooms from database file`);
        } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
                console.warn("Error reading database file, starting with empty database:", error);
            } else {
                console.log("Database file not found, starting with empty database");
            }
            roomsDatabase = {};
            // Create an empty database file
            Deno.writeTextFileSync(DB_PATH, JSON.stringify(roomsDatabase, null, 2));
        }

        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Error initializing database:", error);
        throw error;
    }
}

// Save the database to file
export function saveDatabase(): void {
    try {
        Deno.writeTextFileSync(DB_PATH, JSON.stringify(roomsDatabase, null, 2));
    } catch (error) {
        console.error("Error saving database:", error);
    }
}

// Close/save the database
export function closeDatabase(): void {
    try {
        saveDatabase();
        console.log("Database saved and closed");
    } catch (error) {
        console.error("Error closing database:", error);
    }
}

// Database operations

// Get a room by ID
export function getRoom(roomId: string): Room | undefined {
    return roomsDatabase[roomId];
}

// Store or update a room
export function storeRoom(room: Room): void {
    roomsDatabase[room.id] = room;
    // We'll save periodically instead of on every write for performance
}

// Delete a room
export function deleteRoom(roomId: string): void {
    delete roomsDatabase[roomId];
    // We'll save periodically instead of on every delete for performance
}

// Clean up old rooms
export function cleanupOldRooms(maxAgeMs: number): void {
    const now = Date.now();
    const cutoffTime = now - maxAgeMs;

    let count = 0;
    for (const roomId in roomsDatabase) {
        if (roomsDatabase[roomId].lastActivity < cutoffTime) {
            delete roomsDatabase[roomId];
            count++;
        }
    }

    if (count > 0) {
        console.log(`Cleaned up ${count} old rooms`);
        saveDatabase();
    }
}
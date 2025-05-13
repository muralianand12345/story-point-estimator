import { DB } from "sqlite";

// Initialize the SQLite database
export const db = new DB("rooms.db");

// Create tables if they don't exist
export function initializeDatabase() {
    // Create rooms table
    db.execute(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      hostId TEXT,
      issueName TEXT,
      votingEnabled INTEGER,
      votesRevealed INTEGER,
      createdAt INTEGER,
      lastActivity INTEGER
    )
  `);

    // Create users table
    db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT,
      roomId TEXT,
      name TEXT,
      isHost INTEGER,
      vote TEXT,
      PRIMARY KEY (id, roomId),
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `);

    // Create vote history table
    db.execute(`
    CREATE TABLE IF NOT EXISTS vote_history (
      id TEXT PRIMARY KEY,
      roomId TEXT,
      issueName TEXT,
      finalScore TEXT,
      timestamp INTEGER,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `);

    // Create vote details table
    db.execute(`
    CREATE TABLE IF NOT EXISTS vote_details (
      historyId TEXT,
      userId TEXT,
      userName TEXT,
      vote TEXT,
      PRIMARY KEY (historyId, userId),
      FOREIGN KEY (historyId) REFERENCES vote_history(id) ON DELETE CASCADE
    )
  `);

    console.log("Database initialized");
}
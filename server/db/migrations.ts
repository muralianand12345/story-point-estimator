import { db } from "./client.ts";

async function runMigrations() {
    console.log("Running database migrations...");

    try {
        await db.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        room_code VARCHAR(6) NOT NULL UNIQUE,
        host_id UUID NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS room_users (
        room_id UUID REFERENCES rooms(id),
        user_id UUID REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, user_id)
      );
    `);

        console.log("Migrations completed successfully");
    } catch (error) {
        console.error("Migration error:", error);
        throw error;
    }
}

// Run migrations
if (import.meta.main) {
    await runMigrations();
    Deno.exit(0);
}

export { runMigrations };
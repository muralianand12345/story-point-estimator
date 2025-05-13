import { Application, Router } from "oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { handleConnection } from "./websocket/roomHandler.ts";
import { createRoom, validateRoom, getRoomDetails } from "./api/roomController.ts";
import { roomStore } from "./db/store.ts";
import { initializeDatabase, closeDatabase, saveDatabase } from "./db/database.ts";

// Initialize database
try {
    console.log("Initializing database...");
    initializeDatabase();
} catch (error) {
    console.error("Failed to initialize database. Exiting:", error);
    Deno.exit(1);
}

// Create Oak application
const app = new Application();

// Add CORS middleware
app.use(oakCors({
    origin: true, // Allow any origin or specify your frontend URL
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Add request logging middleware
app.use(async (context, next) => {
    const start = Date.now();

    // Log request details
    console.log(`${context.request.method} ${context.request.url.pathname} - Started`);

    try {
        await next();
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error processing request: ${error.message}`);
        } else {
            console.error("Error processing request:", error);
        }
        throw error;
    }

    // Log response time
    const ms = Date.now() - start;
    console.log(`${context.request.method} ${context.request.url.pathname} - ${context.response.status} - ${ms}ms`);
});

// Create router
const router = new Router();

// API routes
router.post("/api/rooms/create", createRoom);
router.get("/api/rooms/validate", validateRoom);
router.get("/api/rooms/:roomId", getRoomDetails);

// WebSocket route
router.get("/ws/rooms/:roomId", (context) => {
    if (!context.isUpgradable) {
        context.response.status = 400;
        context.response.body = { error: "Cannot upgrade to WebSocket" };
        return;
    }

    const ws = context.upgrade();
    handleConnection(ws);
});

// Periodically save the database (every 5 minutes)
const SAVE_INTERVAL = 5 * 60 * 1000;
const saveInterval = setInterval(() => {
    console.log("Saving database...");
    saveDatabase();
}, SAVE_INTERVAL);

// Clean up old rooms periodically (24 hours)
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
const cleanup = setInterval(() => {
    console.log("Cleaning up old rooms...");
    try {
        roomStore.cleanupOldRooms(48 * 60 * 60 * 1000); // Clean rooms older than 48 hours
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}, CLEANUP_INTERVAL);

// Add shutdown handler
const handleShutdown = () => {
    console.log("Shutting down server...");
    clearInterval(saveInterval);
    clearInterval(cleanup);
    closeDatabase();
    Deno.exit(0);
};

// Handle shutdown signals - Windows only supports SIGINT and SIGBREAK
try {
    Deno.addSignalListener("SIGINT", handleShutdown);

    // On Windows, SIGBREAK is used instead of SIGTERM
    // On non-Windows platforms, use SIGTERM
    if (Deno.build.os === "windows") {
        Deno.addSignalListener("SIGBREAK", handleShutdown);
    } else {
        Deno.addSignalListener("SIGTERM", handleShutdown);
    }
} catch (error) {
    console.warn("Failed to add signal listeners:", error);
}

// Use router
app.use(router.routes());
app.use(router.allowedMethods());

// Log requests
app.use(async (context, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${context.request.method} ${context.request.url} - ${ms}ms`);
});

// Error handling
app.use(async (context, next) => {
    try {
        await next();
    } catch (error) {
        console.error("Server error:", error);
        context.response.status = 500;
        context.response.body = { error: "Internal server error" };
    }
});

// Start server
const PORT = Deno.env.get("PORT") || 8000;
console.log(`Starting server on port ${PORT}...`);

app.listen({ port: Number(PORT) });
console.log(`Server running on http://localhost:${PORT}/`);
import { Application, Router } from "oak";
import { handleConnection } from "./websocket/roomHandler.ts";
import { createRoom, validateRoom, getRoomDetails } from "./api/roomController.ts";
import { roomStore } from "./db/store.ts";
import { initializeDatabase } from "./db/database.ts";

// Initialize database
initializeDatabase();

// Create Oak application
const app = new Application();

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

// Clean up old rooms periodically (24 hours)
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
setInterval(() => {
    console.log("Cleaning up old rooms...");
    roomStore.cleanupOldRooms(48 * 60 * 60 * 1000); // Clean rooms older than 48 hours
}, CLEANUP_INTERVAL);

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
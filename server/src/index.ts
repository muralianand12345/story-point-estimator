import { serve } from "../deps.ts";
import { handleWebSocketConnection } from "./handlers/roomHandler.ts";
import { WebSocketClient } from "./types/index.ts";
import { loadEnv, getEnv } from "./utils/env.ts";

// Load environment variables from .env file
await loadEnv();

// Server configuration
const PORT = parseInt(getEnv("PORT", "8000"));
const HOST = getEnv("HOST", "0.0.0.0");
const ALLOWED_ORIGINS = getEnv("ALLOWED_ORIGINS", "*");

console.log(`Starting WebSocket server on ${HOST}:${PORT}`);

// CORS headers for regular HTTP responses
const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true"  // Add this line
};

// Create HTTP server and handle upgrades to WebSocket
serve(async (req) => {
    const { pathname } = new URL(req.url);

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // Health check endpoint
    if (pathname === "/health") {
        return new Response("OK", {
            status: 200,
            headers: corsHeaders,
        });
    }

    // API version endpoint
    if (pathname === "/version") {
        return new Response(JSON.stringify({ version: "1.0.0" }), {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            }
        });
    }

    // Handle WebSocket connections
    if (pathname === "/ws") {
        if (req.headers.get("upgrade") !== "websocket") {
            return new Response("Expected WebSocket connection", {
                status: 400,
                headers: corsHeaders,
            });
        }

        try {
            // Create WebSocket connection
            const { socket, response } = Deno.upgradeWebSocket(req);

            // Add CORS headers to WebSocket response
            const headers = new Headers(response.headers);
            for (const [key, value] of Object.entries(corsHeaders)) {
                headers.set(key, value);
            }

            // Handle WebSocket connection
            handleWebSocketConnection(socket as WebSocketClient);

            // Return the WebSocket response with CORS headers
            return new Response(response.body, {
                status: response.status,
                headers: headers,
            });
        } catch (err) {
            console.error("WebSocket upgrade failed:", err);
            return new Response("WebSocket upgrade failed", {
                status: 500,
                headers: corsHeaders,
            });
        }
    }

    // test html
    if (pathname === "/test") {
        try {
            // Read the test.html file from the filesystem
            const htmlContent = await Deno.readTextFile("./test.html");

            // Return the HTML content with appropriate headers
            return new Response(htmlContent, {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "text/html; charset=utf-8"
                }
            });
        } catch (error) {
            console.error("Error reading test.html:", error);
            return new Response("Error loading test page", {
                status: 500,
                headers: corsHeaders
            });
        }
    }

    // Not found for all other routes
    return new Response("Not Found", {
        status: 404,
        headers: corsHeaders,
    });
}, { port: PORT, hostname: HOST });

console.log(`WebSocket server is running on ws://${HOST}:${PORT}/ws`);
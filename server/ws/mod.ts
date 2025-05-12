import { roomManager } from "./roomManager.ts";
import { SocketMessage } from "./types.ts";

// WebSocket handler for the Oak middleware
export function handleWs(socket: WebSocket): void {
    console.log("New WebSocket connection");

    let clientId: string | null = null;

    socket.onopen = () => {
        console.log("WebSocket opened");
    };

    socket.onmessage = async (event) => {
        try {
            // Parse and validate incoming message
            if (typeof event.data !== 'string') {
                console.error("Received non-string message");
                return;
            }

            const message = JSON.parse(event.data) as SocketMessage;

            // Validate required fields
            if (!message.event || !message.userId || !message.roomId) {
                console.error("Invalid message format, missing required fields");
                return;
            }

            if (message.event === 'init') {
                clientId = `${message.userId}-${message.roomId}`;
            }

            if (clientId) {
                await roomManager.handleMessage(clientId, message);
            }
        } catch (error) {
            console.error("Error handling WebSocket message:", error);
        }
    };

    socket.onclose = () => {
        console.log("WebSocket closed");
        roomManager.handleDisconnect(socket);
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
}
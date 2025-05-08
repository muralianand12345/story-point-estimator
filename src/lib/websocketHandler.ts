import http from 'http';
import { startWebSocketServer, getWSS, handleUpgrade } from './socketServer';

export const initWebSocketServer = (server: http.Server) => {
    // Initialize WebSocket server with the HTTP server
    return startWebSocketServer(server);
};

// Get the WSS instance
export const getWebSocketServer = () => getWSS();

// Export the handleUpgrade method
export const handleWebSocketUpgrade = handleUpgrade;
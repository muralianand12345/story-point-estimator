import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { MessageType } from '@/lib/types';
import prisma from '@/lib/db';

// Map to store WebSocket connections
const connections = new Map();

// Map to store clients by room
const roomClients = new Map();

let wss: WebSocketServer | null = null;

// Initialize WebSocket server
const initializeWSS = () => {
    if (wss) return wss;

    // Use the WebSocket server from socketServer.ts
    const { startWebSocketServer } = require('@/lib/socketServer');
    wss = startWebSocketServer();

    return wss;
};

export async function GET(req: NextRequest) {
    // Initialize WebSocket server
    initializeWSS();

    // Return a response to let the client know the WebSocket server is running
    return new Response('WebSocket server is running', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}

// Handle all other HTTP methods
export async function POST(req: NextRequest) {
    return new Response('Method not allowed', { status: 405 });
}

export async function PUT(req: NextRequest) {
    return new Response('Method not allowed', { status: 405 });
}

export async function DELETE(req: NextRequest) {
    return new Response('Method not allowed', { status: 405 });
}

export async function PATCH(req: NextRequest) {
    return new Response('Method not allowed', { status: 405 });
}

export const dynamic = 'force-dynamic';
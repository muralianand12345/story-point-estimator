import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    // This is just a health check endpoint for the WebSocket
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
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Allow WebSocket upgrade requests to pass through
    if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
        return NextResponse.next();
    }

    // Continue with normal processing for non-WebSocket requests
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/websocket',
        '/api/socket.io/:path*',
    ],
};
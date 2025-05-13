import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Improve WebSocket handling
    if (pathname.startsWith('/server/ws')) {
        // Get the Deno server URL from environment variables with fallback
        const denoServerUrl = process.env.DENO_SERVER_URL || 'http://localhost:8000';

        // For WebSocket connections, ensure we're using the right protocol
        const wsProtocol = denoServerUrl.startsWith('https') ? 'wss://' : 'ws://';
        const targetHost = denoServerUrl.replace(/^https?:\/\//, '');
        const targetPath = pathname.replace('/server', '');
        const target = `${wsProtocol}${targetHost}${targetPath}`;

        // Log the target for debugging
        console.log(`Proxying WebSocket request to: ${target}`);

        // Return a rewrite with the full WebSocket URL
        return NextResponse.rewrite(new URL(target));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/server/:path*',
    ],
};
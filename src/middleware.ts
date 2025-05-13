import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Proxy WebSocket requests to the Deno server
    if (pathname.startsWith('/server/ws')) {
        const denoServerUrl = process.env.DENO_SERVER_URL || 'http://localhost:8000';
        const target = `${denoServerUrl}${pathname.replace('/server', '')}`;

        return NextResponse.rewrite(new URL(target));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/server/:path*',
    ],
};
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/server/ws')) {
        const denoServerUrl = process.env.DENO_SERVER_URL || 'http://localhost:8000';

        const targetPath = pathname.replace('/server', '');

        const wsProtocol = denoServerUrl.startsWith('https') ? 'wss://' : 'ws://';
        const targetHost = denoServerUrl.replace(/^https?:\/\//, '');
        const target = `${wsProtocol}${targetHost}${targetPath}`;

        console.log(`Proxying WebSocket request to: ${target}`);

        // Either approach should work:
        return NextResponse.rewrite(new URL(target));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/server/:path*',
    ],
};
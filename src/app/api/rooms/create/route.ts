import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const response = await fetch(`${process.env.DENO_SERVER_URL || 'http://localhost:8000'}/api/rooms/create`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        );
    }
}
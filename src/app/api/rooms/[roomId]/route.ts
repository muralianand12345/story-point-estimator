import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    try {
        const roomId = params.roomId;

        if (!roomId) {
            return NextResponse.json(
                { error: 'Room ID is required' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${process.env.DENO_SERVER_URL || 'http://localhost:8000'}/api/rooms/${roomId}`,
            {
                method: 'GET',
            }
        );

        if (response.status === 404) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error getting room details:', error);
        return NextResponse.json(
            { error: 'Failed to get room details' },
            { status: 500 }
        );
    }
}
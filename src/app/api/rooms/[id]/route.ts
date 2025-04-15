import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerRoomEvent, EVENTS } from '@/lib/pusher';

// Get a specific room by ID
export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const { id: roomId } = context.params;

        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
            },
            include: {
                participants: true,
            },
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(room);
    } catch (error) {
        console.error('Error fetching room:', error);
        return NextResponse.json(
            { error: 'Failed to fetch room' },
            { status: 500 }
        );
    }
}

// Update room properties
export async function PATCH(
    request: Request,
    { params }: { params: { id: Promise<string> } }
) {
    try {
        const roomId = await params.id;
        const body = await request.json();
        const { isRevealed } = body;

        const room = await prisma.room.update({
            where: {
                id: roomId,
            },
            data: {
                ...(isRevealed !== undefined && { isRevealed }),
            },
            include: {
                participants: true,
            },
        });

        if (isRevealed !== undefined) {
            triggerRoomEvent(roomId, EVENTS.VOTES_REVEALED, room);
        } else {
            triggerRoomEvent(roomId, EVENTS.ROOM_UPDATED, room);
        }

        return NextResponse.json(room);
    } catch (error) {
        console.error('Error updating room:', error);
        return NextResponse.json(
            { error: 'Failed to update room' },
            { status: 500 }
        );
    }
}

// Delete a room
export async function DELETE(
    request: Request,
    { params }: { params: { id: Promise<string> } }
) {
    try {
        const roomId = await params.id;

        await prisma.room.delete({
            where: {
                id: roomId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json(
            { error: 'Failed to delete room' },
            { status: 500 }
        );
    }
}
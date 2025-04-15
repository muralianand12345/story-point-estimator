import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerRoomEvent, EVENTS } from '@/lib/pusher';

// Reset all votes in a room
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const roomId = params.id;

        // Reset votes for all participants and set isRevealed to false
        await prisma.room.update({
            where: {
                id: roomId,
            },
            data: {
                isRevealed: false,
                participants: {
                    updateMany: {
                        where: {
                            roomId: roomId,
                        },
                        data: {
                            vote: null,
                        },
                    },
                },
            },
        });

        // Get the updated room
        const updatedRoom = await prisma.room.findUnique({
            where: {
                id: roomId,
            },
            include: {
                participants: true,
            },
        });

        triggerRoomEvent(roomId, EVENTS.VOTES_RESET, updatedRoom);

        return NextResponse.json(updatedRoom);
    } catch (error) {
        console.error('Error resetting votes:', error);
        return NextResponse.json(
            { error: 'Failed to reset votes' },
            { status: 500 }
        );
    }
}
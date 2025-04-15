import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerRoomEvent, EVENTS } from '@/lib/pusher';

// Add a participant to a room
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const roomId = params.id;
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Participant name is required' },
                { status: 400 }
            );
        }

        // Check if room exists
        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
            },
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // Add participant to the room
        const participant = await prisma.participant.create({
            data: {
                name,
                roomId,
            },
        });

        // Get the updated room with participants
        const updatedRoom = await prisma.room.findUnique({
            where: {
                id: roomId,
            },
            include: {
                participants: true,
            },
        });

        triggerRoomEvent(roomId, EVENTS.PARTICIPANT_JOINED, {
            participant,
            room: updatedRoom,
        });

        return NextResponse.json({
            participant,
            room: updatedRoom,
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding participant:', error);
        return NextResponse.json(
            { error: 'Failed to add participant' },
            { status: 500 }
        );
    }
}
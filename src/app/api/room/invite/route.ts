import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { roomId, email, userId } = await req.json();

        if (!roomId || !email || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if the user is an admin of the room
        const roomUser = await prisma.roomUser.findUnique({
            where: {
                userId_roomId: {
                    userId,
                    roomId,
                },
            },
        });

        if (!roomUser || !roomUser.isAdmin) {
            return NextResponse.json(
                { error: 'You do not have permission to invite users to this room' },
                { status: 403 }
            );
        }

        // Get the room details
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

        // In a real application, you would send an email here
        // For this example, we'll just return the room code

        return NextResponse.json({
            success: true,
            message: `Invitation sent to ${email}`,
            roomCode: room.roomCode
        }, { status: 200 });
    } catch (error) {
        console.error('Error inviting user:', error);
        return NextResponse.json(
            { error: 'Failed to invite user' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
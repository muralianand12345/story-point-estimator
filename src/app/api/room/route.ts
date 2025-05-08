import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRoomCode } from '@/lib/utils';

// Create a new room
export async function POST(request: Request) {
    try {
        const { roomName, hostName } = await request.json();

        // Validate request data
        if (!roomName || !hostName) {
            return NextResponse.json(
                { error: 'Room name and host name are required' },
                { status: 400 }
            );
        }

        // Generate a unique room code
        const roomCode = await generateRoomCode();

        // Create room and user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    name: hostName,
                },
            });

            // Create room with the user as host
            const room = await tx.room.create({
                data: {
                    name: roomName,
                    roomCode,
                    hostId: user.id,
                    // Add the user to the room
                    users: {
                        create: {
                            userId: user.id,
                        },
                    },
                },
            });

            return {
                roomId: room.id,
                roomCode: room.roomCode,
                userId: user.id,
                userName: user.name,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to create room:', error);
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        );
    }
}
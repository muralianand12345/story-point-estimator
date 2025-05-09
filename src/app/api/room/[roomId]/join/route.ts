import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Join an existing room
export async function POST(
    request: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const { roomId } = params;
        const { userName } = await request.json();

        // Validate request data
        if (!userName) {
            return NextResponse.json(
                { error: 'User name is required' },
                { status: 400 }
            );
        }

        // Check if room exists and is active
        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
                isActive: true,
            },
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found or inactive' },
                { status: 404 }
            );
        }

        // Create user and add to room in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    name: userName,
                },
            });

            // Add user to room
            await tx.roomUser.create({
                data: {
                    roomId: roomId,
                    userId: user.id,
                },
            });

            return {
                userId: user.id,
                userName: user.name,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to join room:', error);
        return NextResponse.json(
            { error: 'Failed to join room' },
            { status: 500 }
        );
    }
}
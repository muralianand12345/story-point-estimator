import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { roomCode, userId, userName } = await req.json();

        if (!roomCode || !userId || !userName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find the room by code
        const room = await prisma.room.findUnique({
            where: {
                roomCode,
            },
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        if (!room.isActive) {
            return NextResponse.json(
                { error: 'Room is no longer active' },
                { status: 400 }
            );
        }

        // Create or update user
        const user = await prisma.user.upsert({
            where: {
                id: userId,
            },
            update: {
                name: userName,
            },
            create: {
                id: userId,
                name: userName,
            },
        });

        // Check if user is already in room
        const existingRoomUser = await prisma.roomUser.findUnique({
            where: {
                userId_roomId: {
                    userId: user.id,
                    roomId: room.id,
                },
            },
        });

        if (!existingRoomUser) {
            // Add user to room
            await prisma.roomUser.create({
                data: {
                    userId: user.id,
                    roomId: room.id,
                    isAdmin: false,
                },
            });
        }

        return NextResponse.json({ room }, { status: 200 });
    } catch (error) {
        console.error('Error joining room:', error);
        return NextResponse.json(
            { error: 'Failed to join room' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Generate a random 6-character room code
const generateRoomCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

export async function POST(req: NextRequest) {
    try {
        const { name, userId, userName } = await req.json();

        if (!name || !userId || !userName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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

        // Generate a unique room code
        let roomCode = generateRoomCode();
        let existingRoom = await prisma.room.findUnique({
            where: {
                roomCode,
            },
        });

        // Keep generating codes until we find a unique one
        while (existingRoom) {
            roomCode = generateRoomCode();
            existingRoom = await prisma.room.findUnique({
                where: {
                    roomCode,
                },
            });
        }

        // Create a new room
        const room = await prisma.room.create({
            data: {
                name,
                roomCode,
                createdById: userId,
                isActive: true,
            },
        });

        // Add user to room as admin
        await prisma.roomUser.create({
            data: {
                userId: user.id,
                roomId: room.id,
                isAdmin: true,
            },
        });

        return NextResponse.json({ room }, { status: 201 });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
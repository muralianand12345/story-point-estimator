import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRoomCode } from '@/utils/roomUtils';

const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { name, description, hostName } = body;

        if (!name || !hostName) {
            return NextResponse.json(
                { error: 'Room name and host name are required' },
                { status: 400 }
            );
        }

        // Generate a unique room ID
        const roomId = generateRoomCode();

        // Create the room with the host as first participant
        const room = await prisma.room.create({
            data: {
                id: roomId,
                name,
                description: description || '',
                participants: {
                    create: {
                        name: hostName,
                        isHost: true,
                    },
                },
            },
            include: {
                participants: true,
            },
        });

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        );
    }
}

const GET = async () => {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                participants: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rooms' },
            { status: 500 }
        );
    }
}

export { POST, GET };
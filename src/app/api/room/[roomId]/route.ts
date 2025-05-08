import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get room details
export async function GET(
    request: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const { roomId } = params;

        // Fetch room details with associated users
        const roomData = await prisma.room.findUnique({
            where: {
                id: roomId,
                isActive: true,
            },
            include: {
                users: {
                    include: {
                        user: true,
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
        });

        if (!roomData) {
            return NextResponse.json(
                { error: 'Room not found or inactive' },
                { status: 404 }
            );
        }

        // Format room data
        const room = {
            id: roomData.id,
            name: roomData.name,
            hostId: roomData.hostId,
            isActive: roomData.isActive,
            createdAt: roomData.createdAt,
        };

        // Format users data
        const users = roomData.users.map(roomUser => ({
            id: roomUser.user.id,
            name: roomUser.user.name,
            createdAt: roomUser.user.createdAt,
        }));

        return NextResponse.json({ room, users });
    } catch (error) {
        console.error('Error fetching room data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch room data' },
            { status: 500 }
        );
    }
}
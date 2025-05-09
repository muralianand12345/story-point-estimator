import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Check if a room exists and is active
export async function GET(
    request: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const { roomId } = params;

        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
                isActive: true,
            },
            select: {
                id: true,
            },
        });

        const exists = !!room;

        return NextResponse.json({
            exists,
            roomId: exists ? roomId : null
        });
    } catch (error) {
        console.error('Error checking room:', error);
        return NextResponse.json(
            { error: 'Failed to check room', exists: false },
            { status: 500 }
        );
    }
}
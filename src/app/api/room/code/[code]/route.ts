import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { code: string } }
) {
    try {
        const { code } = params;

        const room = await prisma.room.findUnique({
            where: {
                roomCode: code.toUpperCase(),
                isActive: true,
            },
            select: {
                id: true,
            },
        });

        if (!room) {
            return NextResponse.json(
                { exists: false, error: 'Room not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            exists: true,
            roomId: room.id,
        });
    } catch (error) {
        console.error('Error finding room by code:', error);
        return NextResponse.json(
            { exists: false, error: 'Error finding room' },
            { status: 500 }
        );
    }
}
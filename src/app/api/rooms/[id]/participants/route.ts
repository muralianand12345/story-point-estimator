import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getParamId } from '@/utils/apiUtils';
import { IContext } from '@/types';

// Add a participant to a room
export async function POST(
	request: Request,
	context: IContext
) {
	try {
		// Extract the ID
		const params = await context.params;
		const roomId = await getParamId(params.id);

		if (!roomId) {
			return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
		}

		const body = await request.json();
		const { name } = body;

		if (!name) {
			return NextResponse.json(
				{ error: 'Participant name is required' },
				{ status: 400 },
			);
		}

		// Check if room exists
		const room = await prisma.room.findUnique({
			where: {
				id: roomId,
			},
		});

		if (!room) {
			return NextResponse.json({ error: 'Room not found' }, { status: 404 });
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

		return NextResponse.json(
			{
				participant,
				room: updatedRoom,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error('Error adding participant:', error);
		return NextResponse.json(
			{ error: 'Failed to add participant' },
			{ status: 500 },
		);
	}
}
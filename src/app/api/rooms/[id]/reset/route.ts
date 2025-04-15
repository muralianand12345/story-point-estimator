import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerRoomEvent, EVENTS } from '@/lib/pusher';

// Reset all votes in a room
export async function POST(request: Request, context: { params: { id: any } }) {
	try {
		// Always await the params.id first, no type checking
		const params = await context.params;
		const roomId = await params.id;

		if (!roomId) {
			return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
		}

		// Reset votes for all participants and set isRevealed to false
		await prisma.room.update({
			where: {
				id: roomId,
			},
			data: {
				isRevealed: false,
				participants: {
					updateMany: {
						where: {
							roomId: roomId,
						},
						data: {
							vote: null,
						},
					},
				},
			},
		});

		// Get the updated room
		const updatedRoom = await prisma.room.findUnique({
			where: {
				id: roomId,
			},
			include: {
				participants: true,
			},
		});

		if (updatedRoom) {
			triggerRoomEvent(roomId, EVENTS.VOTES_RESET, updatedRoom);
		}

		return NextResponse.json(updatedRoom);
	} catch (error) {
		console.error('Error resetting votes:', error);
		return NextResponse.json(
			{ error: 'Failed to reset votes' },
			{ status: 500 },
		);
	}
}

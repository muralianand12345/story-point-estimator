import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getParamId } from '@/utils/apiUtils';
import { IContext } from '@/types';

const POST = async (
	request: Request,
	context: IContext
) => {
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
			include: {
				participants: true,
			},
		});

		if (!room) {
			return NextResponse.json({ error: 'Room not found' }, { status: 404 });
		}

		// Clean up inactive participants (those who haven't updated in 30 seconds)
		const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
		try {
			await prisma.participant.deleteMany({
				where: {
					roomId: roomId,
					updatedAt: {
						lt: thirtySecondsAgo
					},
					isHost: false  // Never auto-remove the host
				}
			});
		} catch (error) {
			// This might fail if isHost column doesn't exist, which is fine
			// Just try without the isHost filter
			try {
				await prisma.participant.deleteMany({
					where: {
						roomId: roomId,
						updatedAt: {
							lt: thirtySecondsAgo
						}
					}
				});
			} catch (innerError) {
				console.error('Error cleaning up inactive participants:', innerError);
			}
		}

		// Check if a participant with this name already exists
		const existingParticipant = room.participants.find(
			p => p.name === name
		);

		if (existingParticipant) {
			// Return the existing participant instead of creating a new one
			return NextResponse.json(
				{
					participant: existingParticipant,
					room: room,
				},
				{ status: 200 },
			);
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

// Add GET endpoint to list participants with cleanup
const GET = async (
	request: Request,
	context: IContext
) => {
	try {
		// Extract the ID
		const params = await context.params;
		const roomId = await getParamId(params.id);

		if (!roomId) {
			return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
		}

		// Clean up inactive participants (those who haven't updated in 30 seconds)
		const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
		try {
			await prisma.participant.deleteMany({
				where: {
					roomId: roomId,
					updatedAt: {
						lt: thirtySecondsAgo
					},
					isHost: false  // Never auto-remove the host
				}
			});
		} catch (error) {
			// If isHost field isn't available, use a more basic cleanup
			try {
				await prisma.participant.deleteMany({
					where: {
						roomId: roomId,
						updatedAt: {
							lt: thirtySecondsAgo
						}
					}
				});
			} catch (innerError) {
				console.error('Error cleaning up inactive participants:', innerError);
			}
		}

		// Get participants
		const participants = await prisma.participant.findMany({
			where: {
				roomId: roomId,
			},
		});

		return NextResponse.json(participants);
	} catch (error) {
		console.error('Error getting participants:', error);
		return NextResponse.json(
			{ error: 'Failed to get participants' },
			{ status: 500 },
		);
	}
}

export { POST, GET };
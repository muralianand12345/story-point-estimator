import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getParamId } from '@/utils/apiUtils';
import { IContext } from '@/types';

const PATCH = async (
	request: Request,
	context: IContext
) => {
	try {
		// Extract the IDs
		const params = await context.params;
		const roomId = await getParamId(params.id);
		const participantId = await getParamId(params.participantsId);

		if (!roomId || !participantId) {
			return NextResponse.json(
				{ error: 'Invalid room or participant ID' },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { vote, timestamp } = body;

		// Check if participant exists
		const participant = await prisma.participant.findUnique({
			where: {
				id: participantId,
				roomId: roomId,
			},
		});

		if (!participant) {
			return NextResponse.json(
				{ error: 'Participant not found' },
				{ status: 404 },
			);
		}

		// Update participant data
		const updateData: any = {};

		// Only update vote if it's provided
		if (vote !== undefined) {
			updateData.vote = vote;
		}

		// If this is a heartbeat/activity update
		if (timestamp) {
			// With the current schema, we don't need to do anything special
			// The updatedAt field will automatically be updated when we make any change
			// We'll add a small update to trigger the updatedAt timestamp update
			await prisma.participant.update({
				where: {
					id: participantId,
					roomId: roomId,
				},
				data: {
					// Just update with the current values to trigger updatedAt update
					name: participant.name
				},
			});
		}

		// Only perform the update if there's a vote change
		if (Object.keys(updateData).length > 0) {
			await prisma.participant.update({
				where: {
					id: participantId,
					roomId: roomId,
				},
				data: updateData,
			});
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

		// Return the updated room with participants
		const updatedRoom = await prisma.room.findUnique({
			where: {
				id: roomId,
			},
			include: {
				participants: true,
			},
		});

		return NextResponse.json(updatedRoom);
	} catch (error) {
		console.error('Error updating participant:', error);
		return NextResponse.json(
			{ error: 'Failed to update participant' },
			{ status: 500 },
		);
	}
}

const DELETE = async (
	request: Request,
	context: IContext
) => {
	try {
		// Extract the IDs
		const params = await context.params;
		const roomId = await getParamId(params.id);
		const participantId = await getParamId(params.participantsId);

		if (!roomId || !participantId) {
			return NextResponse.json(
				{ error: 'Invalid room or participant ID' },
				{ status: 400 },
			);
		}

		// First, check if the participant is the host
		const participant = await prisma.participant.findUnique({
			where: {
				id: participantId,
				roomId: roomId,
			},
		});

		if (!participant) {
			return NextResponse.json(
				{ error: 'Participant not found' },
				{ status: 404 },
			);
		}

		const isHost = participant.isHost;

		// Delete the participant
		await prisma.participant.delete({
			where: {
				id: participantId,
				roomId: roomId,
			},
		});

		// Check if any participants remain
		const remainingParticipants = await prisma.participant.findMany({
			where: {
				roomId: roomId,
			},
		});

		// If no participants remain, delete the room
		if (remainingParticipants.length === 0) {
			await prisma.room.delete({
				where: {
					id: roomId,
				},
			});

			return NextResponse.json({ roomDeleted: true });
		}

		// If the deleted participant was the host, assign a new host
		if (isHost && remainingParticipants.length > 0) {
			await prisma.participant.update({
				where: {
					id: remainingParticipants[0].id,
				},
				data: {
					isHost: true,
				},
			});
		}

		// Return the updated room with participants
		const updatedRoom = await prisma.room.findUnique({
			where: {
				id: roomId,
			},
			include: {
				participants: true,
			},
		});

		return NextResponse.json({
			roomDeleted: false,
			room: updatedRoom,
		});
	} catch (error) {
		console.error('Error removing participant:', error);
		return NextResponse.json(
			{ error: 'Failed to remove participant' },
			{ status: 500 },
		);
	}
}

// Add GET endpoint to check if a participant exists
const GET = async (
	request: Request,
	context: IContext
) => {
	try {
		// Extract the IDs
		const params = await context.params;
		const roomId = await getParamId(params.id);
		const participantId = await getParamId(params.participantsId);

		if (!roomId || !participantId) {
			return NextResponse.json(
				{ error: 'Invalid room or participant ID' },
				{ status: 400 },
			);
		}

		// Check if participant exists
		const participant = await prisma.participant.findUnique({
			where: {
				id: participantId,
				roomId: roomId,
			},
		});

		if (!participant) {
			return NextResponse.json(
				{ exists: false }
			);
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
			// If isHost field isn't available, try without it
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

		// Return the participant and room
		const room = await prisma.room.findUnique({
			where: {
				id: roomId,
			},
			include: {
				participants: true,
			},
		});

		return NextResponse.json({
			exists: true,
			participant,
			room
		});
	} catch (error) {
		console.error('Error checking participant:', error);
		return NextResponse.json(
			{ error: 'Failed to check participant' },
			{ status: 500 },
		);
	}
}

export { GET, PATCH, DELETE };
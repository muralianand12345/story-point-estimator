import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerRoomEvent, EVENTS } from '@/lib/pusher';

// Submit a vote for a participant
export async function PATCH(
	request: Request,
	context: { params: { id: any; participantId: any } },
) {
	try {
		// Always await the params first, no type checking
		const params = await context.params;
		const roomId = await params.id;
		const participantId = await context.params.participantId;

		if (!roomId || !participantId) {
			return NextResponse.json(
				{ error: 'Invalid room or participant ID' },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { vote } = body;

		// Update participant's vote
		await prisma.participant.update({
			where: {
				id: participantId,
				roomId: roomId,
			},
			data: {
				vote,
			},
		});

		// Return the updated room with participants
		const updatedRoom = await prisma.room.findUnique({
			where: {
				id: roomId,
			},
			include: {
				participants: true,
			},
		});

		if (updatedRoom) {
			triggerRoomEvent(roomId, EVENTS.VOTE_SUBMITTED, updatedRoom);
		}

		return NextResponse.json(updatedRoom);
	} catch (error) {
		console.error('Error submitting vote:', error);
		return NextResponse.json(
			{ error: 'Failed to submit vote' },
			{ status: 500 },
		);
	}
}

// Remove a participant from a room
export async function DELETE(
	request: Request,
	context: { params: { id: any; participantId: any } },
) {
	try {
		// Always await the params first, no type checking
		const params = await context.params;
		const roomId = await params.id;
		const participantId = await context.params.participantId;

		if (!roomId || !participantId) {
			return NextResponse.json(
				{ error: 'Invalid room or participant ID' },
				{ status: 400 },
			);
		}

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

			triggerRoomEvent(roomId, EVENTS.ROOM_UPDATED, { deleted: true });

			return NextResponse.json({ roomDeleted: true });
		}

		// If host was removed, assign a new host
		const hasHost = remainingParticipants.some(
			(p: { isHost: boolean }) => p.isHost,
		);
		if (!hasHost && remainingParticipants.length > 0) {
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

		triggerRoomEvent(roomId, EVENTS.PARTICIPANT_LEFT, {
			participantId,
			roomDeleted: false,
			room: updatedRoom,
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

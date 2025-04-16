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

		return NextResponse.json(updatedRoom);
	} catch (error) {
		console.error('Error submitting vote:', error);
		return NextResponse.json(
			{ error: 'Failed to submit vote' },
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

export { PATCH, DELETE };
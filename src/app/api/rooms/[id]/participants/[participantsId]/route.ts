import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Submit a vote for a participant
export async function PATCH(
	request: Request,
	context: { params: { id: string; participantsId: string } }, // Note the correct parameter name: participantsId
) {
	try {
		// Extract the IDs
		const roomId = context.params.id;
		const participantId = context.params.participantsId; // Access the correct parameter name

		console.log("Debug - roomId:", roomId);
		console.log("Debug - participantId:", participantId);

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

// Remove a participant from a room
export async function DELETE(
	request: Request,
	context: { params: { id: string; participantsId: string } }, // Note the correct parameter name
) {
	try {
		// Extract the IDs
		const roomId = context.params.id;
		const participantId = context.params.participantsId; // Access the correct parameter name

		console.log("Debug - roomId:", roomId);
		console.log("Debug - participantId:", participantId);

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
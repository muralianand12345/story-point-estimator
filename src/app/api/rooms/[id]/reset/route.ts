import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getParamId } from '@/utils/apiUtils';
import { IContext } from '@/types';

// Reset all votes in a room
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

		return NextResponse.json(updatedRoom);
	} catch (error) {
		console.error('Error resetting votes:', error);
		return NextResponse.json(
			{ error: 'Failed to reset votes' },
			{ status: 500 },
		);
	}
}
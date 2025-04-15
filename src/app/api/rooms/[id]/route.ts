import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get a specific room by ID
export async function GET(request: Request, context: { params: { id: any } }) {
	try {
		// First await the entire params object
		const params = await context.params;
		// Then extract the ID
		const roomId = params.id;

		if (!roomId) {
			return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
		}

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

		return NextResponse.json(room);
	} catch (error) {
		console.error('Error fetching room:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch room' },
			{ status: 500 },
		);
	}
}

// Update room properties
export async function PATCH(
	request: Request,
	context: { params: { id: any } },
) {
	try {
		// First await the entire params object
		const params = await context.params;
		// Then extract the ID
		const roomId = params.id;

		if (!roomId) {
			return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
		}

		const body = await request.json();
		const { isRevealed } = body;

		const room = await prisma.room.update({
			where: {
				id: roomId,
			},
			data: {
				...(isRevealed !== undefined && { isRevealed }),
			},
			include: {
				participants: true,
			},
		});

		return NextResponse.json(room);
	} catch (error) {
		console.error('Error updating room:', error);
		return NextResponse.json(
			{ error: 'Failed to update room' },
			{ status: 500 },
		);
	}
}

// Delete a room
export async function DELETE(
	request: Request,
	context: { params: { id: any } },
) {
	try {
		// First await the entire params object
		const params = await context.params;
		// Then extract the ID
		const roomId = params.id;

		if (!roomId) {
			return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
		}

		await prisma.room.delete({
			where: {
				id: roomId,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting room:', error);
		return NextResponse.json(
			{ error: 'Failed to delete room' },
			{ status: 500 },
		);
	}
}
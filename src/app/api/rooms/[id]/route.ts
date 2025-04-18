import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getParamId } from '@/utils/apiUtils';
import { IContext } from '@/types';

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

const PATCH = async (
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

const DELETE = async (
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

export { GET, PATCH, DELETE };
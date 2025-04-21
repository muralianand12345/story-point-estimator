import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getParamId } from '@/utils/apiUtils';
import { IContext } from '@/types';

const POST = async (
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

        // Instead of marking as inactive (which we don't have yet),
        // we'll directly remove the participant
        await prisma.participant.delete({
            where: {
                id: participantId,
                roomId: roomId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing inactive participant:', error);
        return NextResponse.json(
            { error: 'Failed to remove participant' },
            { status: 500 },
        );
    }
}

export { POST };
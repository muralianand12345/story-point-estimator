import prisma from './prisma';

/**
 * Generates a unique 6-character alphanumeric room code
 */
export const generateRoomCode = async (): Promise<string> => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    const codeLength = 6;
    let roomCode: string;
    let isUnique = false;

    // Keep generating codes until we find a unique one
    while (!isUnique) {
        let code = '';
        for (let i = 0; i < codeLength; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters.charAt(randomIndex);
        }

        // Check if code already exists
        const existingRoom = await prisma.room.findUnique({
            where: { roomCode: code },
        });

        if (!existingRoom) {
            roomCode = code;
            isUnique = true;
        }
    }

    return roomCode!;
};
import { PrismaClient } from '@prisma/client';
import { generateRoomCode } from '../src/utils/roomUtils';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    // Clean up any existing data
    console.log('Cleaning up existing data...');
    await prisma.participant.deleteMany({});
    await prisma.room.deleteMany({});

    // Create a sample room
    console.log('Creating sample room...');
    const roomId = generateRoomCode();
    const room = await prisma.room.create({
        data: {
            id: roomId,
            name: 'Sample Planning Room',
            description: 'A sample room for sprint planning',
            participants: {
                create: [
                    {
                        name: 'John (Host)',
                        isHost: true,
                    },
                    {
                        name: 'Alice',
                        vote: '5',
                    },
                    {
                        name: 'Bob',
                        vote: '3',
                    },
                ],
            },
        },
        include: {
            participants: true,
        },
    });

    console.log(`Created sample room with ID: ${room.id}`);
    console.log(`Room has ${room.participants.length} participants`);

    console.log('Database seed completed successfully!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('Error during database seed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
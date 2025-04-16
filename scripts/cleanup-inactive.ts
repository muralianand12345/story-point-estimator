import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This script cleans up inactive participants and empty rooms
 * It should be run periodically (e.g., every 5 minutes) via a cron job
 */
const cleanupInactive = async () => {
    try {
        console.log('Starting cleanup of inactive participants and empty rooms...');

        // Calculate the cutoff time for inactivity
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

        // Find and remove inactive participants based on updatedAt
        // This works with the existing schema without additional columns
        const inactiveParticipants = await prisma.participant.findMany({
            where: {
                updatedAt: {
                    lt: oneMinuteAgo
                },
                // Don't remove hosts automatically
                isHost: false
            }
        });

        console.log(`Found ${inactiveParticipants.length} inactive participants to remove`);

        // Delete each inactive participant
        for (const participant of inactiveParticipants) {
            await prisma.participant.delete({
                where: {
                    id: participant.id
                }
            });
            console.log(`Removed inactive participant: ${participant.name} (${participant.id})`);
        }

        // Find and delete empty rooms
        const emptyRooms = await prisma.room.findMany({
            include: {
                participants: true
            },
            where: {
                participants: {
                    none: {}
                }
            }
        });

        console.log(`Found ${emptyRooms.length} empty rooms to remove`);

        // Delete each empty room
        for (const room of emptyRooms) {
            await prisma.room.delete({
                where: {
                    id: room.id
                }
            });
            console.log(`Removed empty room: ${room.name} (${room.id})`);
        }

        console.log('Cleanup completed successfully!');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
};

// Run the cleanup
cleanupInactive()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error during cleanup:', error);
        process.exit(1);
    });
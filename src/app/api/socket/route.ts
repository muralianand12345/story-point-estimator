import { NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import prisma from '../../../lib/prisma';
import { SocketEvent, VotingState } from '../../../types';

// Global variable to store the socket server instance
let io: SocketIOServer;

// Store voting state for each room
const votingStates: Record<string, VotingState> = {};

export async function GET(req: Request) {
    return new NextResponse('Socket server running');
}

// Socket.io server setup for pages/api/socket.ts (to be used with Next.js API routes)
export const setupSocketServer = (server: NetServer) => {
    if (io) {
        console.log('Socket server already running');
        return io;
    }

    io = new SocketIOServer(server, {
        path: '/api/socketio',
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        const roomId = socket.handshake.query.roomId as string;
        const userId = socket.handshake.query.userId as string;

        if (!roomId || !userId) {
            console.log('Missing roomId or userId', { roomId, userId });
            socket.disconnect();
            return;
        }

        console.log(`User ${userId} connected to room ${roomId}`);
        socket.join(roomId);

        // Initialize voting state for the room if it doesn't exist yet
        if (!votingStates[roomId]) {
            votingStates[roomId] = {
                isRevealed: false,
                votes: {},
                currentIssue: ''
            };
        }

        // Notify others in the room
        socket.to(roomId).emit(SocketEvent.USER_JOINED, { userId });

        // Send current voting state to newly connected user
        if (votingStates[roomId]) {
            socket.emit(SocketEvent.VOTES_UPDATED, votingStates[roomId].votes);
            socket.emit(SocketEvent.REVEAL_VOTES, votingStates[roomId].isRevealed);
            if (votingStates[roomId].currentIssue) {
                socket.emit(SocketEvent.ISSUE_UPDATED, votingStates[roomId].currentIssue);
            }
        }

        // Handle submit vote
        socket.on(SocketEvent.SUBMIT_VOTE, (value) => {
            const roomVotingState = votingStates[roomId];

            if (roomVotingState && !roomVotingState.isRevealed) {
                // Add or update vote
                roomVotingState.votes[userId] = {
                    userId,
                    value
                };

                // Broadcast updated votes to all users in the room
                io.to(roomId).emit(SocketEvent.VOTES_UPDATED, roomVotingState.votes);
            }
        });

        // Handle reveal votes (host only)
        socket.on(SocketEvent.REVEAL_VOTES, async (reveal) => {
            try {
                // Verify the requesting user is the host
                const room = await prisma.room.findUnique({
                    where: {
                        id: roomId,
                        isActive: true,
                    },
                    select: {
                        hostId: true,
                    },
                });

                if (!room || room.hostId !== userId) {
                    console.log(`Unauthorized reveal attempt by non-host user ${userId}`);
                    return;
                }

                const roomVotingState = votingStates[roomId];
                if (roomVotingState) {
                    roomVotingState.isRevealed = reveal;
                    io.to(roomId).emit(SocketEvent.REVEAL_VOTES, reveal);
                }
            } catch (error) {
                console.error('Error revealing votes:', error);
            }
        });

        // Handle reset votes (host only)
        socket.on(SocketEvent.RESET_VOTES, async () => {
            try {
                // Verify the requesting user is the host
                const room = await prisma.room.findUnique({
                    where: {
                        id: roomId,
                        isActive: true,
                    },
                    select: {
                        hostId: true,
                    },
                });

                if (!room || room.hostId !== userId) {
                    console.log(`Unauthorized reset attempt by non-host user ${userId}`);
                    return;
                }

                // Reset voting state
                votingStates[roomId] = {
                    isRevealed: false,
                    votes: {},
                    currentIssue: votingStates[roomId]?.currentIssue || ''
                };

                // Notify all users in the room
                io.to(roomId).emit(SocketEvent.RESET_VOTES);
            } catch (error) {
                console.error('Error resetting votes:', error);
            }
        });

        // Handle issue update (host only)
        socket.on(SocketEvent.ISSUE_UPDATED, async (issue) => {
            try {
                // Verify the requesting user is the host
                const room = await prisma.room.findUnique({
                    where: {
                        id: roomId,
                        isActive: true,
                    },
                    select: {
                        hostId: true,
                    },
                });

                if (!room || room.hostId !== userId) {
                    console.log(`Unauthorized issue update attempt by non-host user ${userId}`);
                    return;
                }

                const roomVotingState = votingStates[roomId];
                if (roomVotingState) {
                    roomVotingState.currentIssue = issue;
                    io.to(roomId).emit(SocketEvent.ISSUE_UPDATED, issue);
                }
            } catch (error) {
                console.error('Error updating issue:', error);
            }
        });

        // Handle user disconnection
        socket.on('disconnect', async () => {
            console.log(`User ${userId} disconnected from room ${roomId}`);

            try {
                // Remove user's vote if they had one
                if (votingStates[roomId] && votingStates[roomId].votes[userId]) {
                    delete votingStates[roomId].votes[userId];
                    io.to(roomId).emit(SocketEvent.VOTES_UPDATED, votingStates[roomId].votes);
                }

                // Check if user is host
                const room = await prisma.room.findUnique({
                    where: {
                        id: roomId,
                        isActive: true,
                    },
                    select: {
                        id: true,
                        hostId: true,
                    },
                });

                if (room) {
                    // If disconnected user is the host, reassign host role
                    if (room.hostId === userId) {
                        // Find next host (earliest joined user)
                        const nextHost = await prisma.roomUser.findFirst({
                            where: {
                                roomId: roomId,
                                userId: {
                                    not: userId,
                                },
                            },
                            orderBy: {
                                joinedAt: 'asc',
                            },
                            select: {
                                userId: true,
                            },
                        });

                        if (nextHost) {
                            const newHostId = nextHost.userId;

                            // Update host in database
                            await prisma.room.update({
                                where: {
                                    id: roomId,
                                },
                                data: {
                                    hostId: newHostId,
                                },
                            });

                            // Notify everyone about the new host
                            io.to(roomId).emit(SocketEvent.HOST_CHANGED, newHostId);
                            console.log(`New host assigned: ${newHostId}`);
                        } else {
                            // No users left, deactivate room
                            await prisma.room.update({
                                where: {
                                    id: roomId,
                                },
                                data: {
                                    isActive: false,
                                },
                            });

                            // Clean up voting state
                            delete votingStates[roomId];

                            console.log(`Room ${roomId} deactivated`);
                        }
                    }
                }

                // Remove user from room
                await prisma.roomUser.delete({
                    where: {
                        roomId_userId: {
                            roomId: roomId,
                            userId: userId,
                        },
                    },
                });

                // Notify everyone that the user has left
                socket.to(roomId).emit(SocketEvent.USER_LEFT, userId);
            } catch (error) {
                console.error('Error handling user disconnection:', error);
            }
        });

        // Handle kick user event
        socket.on(SocketEvent.KICK_USER, async (kickUserId) => {
            try {
                // Verify the requesting user is the host
                const room = await prisma.room.findUnique({
                    where: {
                        id: roomId,
                        isActive: true,
                    },
                    select: {
                        hostId: true,
                    },
                });

                if (!room || room.hostId !== userId) {
                    console.log(`Unauthorized kick attempt by non-host user ${userId}`);
                    return;
                }

                // Find and disconnect the kicked user's socket
                const socketsInRoom = await io.in(roomId).fetchSockets();
                const socketToKick = socketsInRoom.find(
                    (s) => s.handshake.query.userId === kickUserId
                );

                if (socketToKick) {
                    // Notify the user they've been kicked
                    socketToKick.emit(SocketEvent.KICKED);
                    socketToKick.disconnect();
                }

                // Remove user's vote if they had one
                if (votingStates[roomId] && votingStates[roomId].votes[kickUserId]) {
                    delete votingStates[roomId].votes[kickUserId];
                    io.to(roomId).emit(SocketEvent.VOTES_UPDATED, votingStates[roomId].votes);
                }

                // Remove user from room in database
                await prisma.roomUser.delete({
                    where: {
                        roomId_userId: {
                            roomId: roomId,
                            userId: kickUserId,
                        },
                    },
                });

                // Notify everyone that user has been kicked
                io.to(roomId).emit(SocketEvent.USER_LEFT, kickUserId);
            } catch (error) {
                console.error('Error kicking user:', error);
            }
        });

        // Handle leave room event
        socket.on(SocketEvent.LEAVE_ROOM, () => {
            // Remove user's vote if they had one
            if (votingStates[roomId] && votingStates[roomId].votes[userId]) {
                delete votingStates[roomId].votes[userId];
                io.to(roomId).emit(SocketEvent.VOTES_UPDATED, votingStates[roomId].votes);
            }

            socket.disconnect();
        });
    });

    console.log('Socket.io server started');
    return io;
};
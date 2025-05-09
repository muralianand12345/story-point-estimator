import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SocketEvent, VotingState } from '@/types';

export const runtime = 'edge';
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

// In-memory storage (will reset on deployment, but could be replaced with Redis/etc.)
const connections: Map<string, Map<string, { ws: WebSocket, userId: string }>> = new Map();
const votingStates: Map<string, VotingState> = new Map();

// Connect to prisma
// Note: Prisma in Edge runtime requires Data Proxy or a connection pool manager
const prisma = new PrismaClient();

// Helper function to send data to a specific room
function sendToRoom(roomId: string, event: string, data: any, excludeUserId?: string) {
    if (!connections.has(roomId)) return;
    const roomConnections = connections.get(roomId)!;

    const message = JSON.stringify({ event, data });

    for (const [connectionId, { ws, userId }] of roomConnections.entries()) {
        if (excludeUserId && userId === excludeUserId) continue;

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    }
}

// Check if a user is a host
async function isUserHost(roomId: string, userId: string): Promise<boolean> {
    try {
        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
                isActive: true,
            },
            select: {
                hostId: true,
            },
        });

        return !!room && room.hostId === userId;
    } catch (error) {
        console.error('Error checking if user is host:', error);
        return false;
    }
}

// Handle user disconnection
async function handleDisconnect(roomId: string, connectionId: string, userId: string) {
    // Remove connection
    if (connections.has(roomId)) {
        const roomConnections = connections.get(roomId)!;
        roomConnections.delete(connectionId);

        // Remove room if empty
        if (roomConnections.size === 0) {
            connections.delete(roomId);
            votingStates.delete(roomId);
        }
    }

    // Remove vote if exists
    if (votingStates.has(roomId)) {
        const state = votingStates.get(roomId)!;
        if (state.votes[userId]) {
            delete state.votes[userId];
            sendToRoom(roomId, SocketEvent.VOTES_UPDATED, state.votes);
        }
    }

    try {
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
                    sendToRoom(roomId, SocketEvent.HOST_CHANGED, newHostId);
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

                    console.log(`Room ${roomId} deactivated`);
                }
            }
        }

        // Remove user from room
        const roomUser = await prisma.roomUser.findUnique({
            where: {
                roomId_userId: {
                    roomId: roomId,
                    userId: userId,
                },
            },
        });

        if (roomUser) {
            await prisma.roomUser.delete({
                where: {
                    roomId_userId: {
                        roomId: roomId,
                        userId: userId,
                    },
                },
            });

            // Notify everyone that the user has left
            sendToRoom(roomId, SocketEvent.USER_LEFT, userId);
        }
    } catch (error) {
        console.error('Error handling user disconnection:', error);
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');

    if (!roomId || !userId) {
        return new Response('Missing required parameters: roomId and userId', { status: 400 });
    }

    // Upgrade the connection to WebSocket if supported by the runtime
    const upgradeHeader = req.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket connection', { status: 426 });
    }

    try {
        // The WebSocket server is part of the Edge Runtime
        const { socket, response } = (Deno as any).upgradeWebSocket(req);

        // Generate a unique connection ID
        const connectionId = Math.random().toString(36).substring(2, 15);

        // Initialize room connections if needed
        if (!connections.has(roomId)) {
            connections.set(roomId, new Map());
        }

        // Add this connection to the room
        connections.get(roomId)!.set(connectionId, { ws: socket, userId });

        // Initialize voting state if needed
        if (!votingStates.has(roomId)) {
            votingStates.set(roomId, {
                isRevealed: false,
                votes: {},
                currentIssue: '',
            });
        }

        // Send current state to the new connection
        const currentState = votingStates.get(roomId)!;
        socket.send(JSON.stringify({
            event: 'initialize',
            data: {
                votes: currentState.votes,
                isRevealed: currentState.isRevealed,
                currentIssue: currentState.currentIssue,
            }
        }));

        // Notify others that a user has joined
        sendToRoom(roomId, SocketEvent.USER_JOINED, { userId }, userId);

        // Handle incoming messages
        socket.onmessage = async (event) => {
            try {
                const { event: eventType, data } = JSON.parse(event.data);

                switch (eventType) {
                    case SocketEvent.SUBMIT_VOTE:
                        // Handle vote submission
                        if (!votingStates.has(roomId)) break;

                        const state = votingStates.get(roomId)!;
                        if (state.isRevealed) break; // Can't vote if votes are revealed

                        state.votes[userId] = { userId, value: data };
                        sendToRoom(roomId, SocketEvent.VOTES_UPDATED, state.votes);
                        break;

                    case SocketEvent.REVEAL_VOTES:
                        // Check if user is host
                        const isHost = await isUserHost(roomId, userId);
                        if (!isHost) break;

                        if (votingStates.has(roomId)) {
                            const state = votingStates.get(roomId)!;
                            state.isRevealed = data;
                            sendToRoom(roomId, SocketEvent.REVEAL_VOTES, data);
                        }
                        break;

                    case SocketEvent.RESET_VOTES:
                        // Check if user is host
                        const canReset = await isUserHost(roomId, userId);
                        if (!canReset) break;

                        if (votingStates.has(roomId)) {
                            const currentIssue = votingStates.get(roomId)!.currentIssue;
                            votingStates.set(roomId, {
                                isRevealed: false,
                                votes: {},
                                currentIssue,
                            });
                            sendToRoom(roomId, SocketEvent.RESET_VOTES, null);
                        }
                        break;

                    case SocketEvent.ISSUE_UPDATED:
                        // Check if user is host
                        const canUpdateIssue = await isUserHost(roomId, userId);
                        if (!canUpdateIssue) break;

                        if (votingStates.has(roomId)) {
                            const state = votingStates.get(roomId)!;
                            state.currentIssue = data;
                            sendToRoom(roomId, SocketEvent.ISSUE_UPDATED, data);
                        }
                        break;

                    case SocketEvent.KICK_USER:
                        // Check if user is host
                        const canKick = await isUserHost(roomId, userId);
                        if (!canKick) break;

                        const kickUserId = data;

                        // Find the connection for the kicked user
                        let kickedConnection: string | null = null;

                        if (connections.has(roomId)) {
                            const roomConnections = connections.get(roomId)!;
                            for (const [connId, { userId: uid }] of roomConnections.entries()) {
                                if (uid === kickUserId) {
                                    kickedConnection = connId;
                                    break;
                                }
                            }

                            // If found, notify and close their connection
                            if (kickedConnection) {
                                const { ws } = roomConnections.get(kickedConnection)!;
                                ws.send(JSON.stringify({ event: SocketEvent.KICKED }));
                                ws.close();

                                // Remove them from the room
                                handleDisconnect(roomId, kickedConnection, kickUserId);
                            }
                        }
                        break;

                    case SocketEvent.LEAVE_ROOM:
                        // User is manually leaving the room
                        socket.close();
                        break;
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        // Handle disconnection
        socket.onclose = () => {
            handleDisconnect(roomId, connectionId, userId);
        };

        // Return the upgraded response
        return response;
    } catch (error) {
        console.error('Error setting up WebSocket:', error);
        return new Response('Internal server error', { status: 500 });
    }
}
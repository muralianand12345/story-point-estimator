// src/app/api/ws/route.ts
import { WebSocketServer } from 'ws';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageType } from '@/types/websocket';

// Store active connections
interface RoomSubscriptions {
    [roomId: string]: Map<string, WebSocket>;
}

const roomSubscriptions: RoomSubscriptions = {};
let wss: WebSocketServer | null = null;

export async function GET(request: Request) {
    if (!wss) {
        wss = new WebSocketServer({ noServer: true });
    }

    const { socket, response } = Reflect.get(request, 'socket')
        ? { socket: Reflect.get(request, 'socket'), response: new Response(null) }
        : { socket: null, response: new Response('Upgrade to WebSocket protocol failed', { status: 426 }) };

    if (!socket) {
        return response;
    }

    const ws = socket as unknown as WebSocket;

    // Store participant and room info
    let currentParticipantId: string | null = null;
    let currentRoomId: string | null = null;

    console.log('WebSocket connection established');

    // Set up heartbeat to keep connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            // Respond to heartbeats from client
            ws.send(JSON.stringify({ type: MessageType.HEARTBEAT_ACK }));
        }
    }, 30000);

    // Handle incoming messages
    ws.addEventListener('message', async (event) => {
        try {
            const data = event.data;
            const message = JSON.parse(typeof data === 'string' ? data : data.toString());

            // Extract message type
            const { type, payload } = message;

            switch (type) {
                case MessageType.JOIN_ROOM:
                    await handleJoinRoom(ws, payload);
                    currentRoomId = payload.roomId;
                    currentParticipantId = payload.participantId;
                    break;

                case MessageType.LEAVE_ROOM:
                    await handleLeaveRoom(ws, payload);
                    currentRoomId = null;
                    currentParticipantId = null;
                    break;

                case MessageType.SUBMIT_VOTE:
                    await handleSubmitVote(ws, payload);
                    break;

                case MessageType.REVEAL_VOTES:
                    await handleRevealVotes(ws, payload);
                    break;

                case MessageType.RESET_VOTES:
                    await handleResetVotes(ws, payload);
                    break;

                case MessageType.HEARTBEAT:
                    // Store current session info from heartbeat
                    if (payload.roomId && payload.participantId) {
                        currentRoomId = payload.roomId;
                        currentParticipantId = payload.participantId;

                        // Update participant's lastActive timestamp
                        try {
                            await prisma.participant.update({
                                where: {
                                    id: payload.participantId,
                                    roomId: payload.roomId
                                },
                                data: {
                                    lastActive: new Date()
                                }
                            });
                        } catch (error) {
                            console.error('Error updating participant activity:', error);
                        }
                    }

                    // Send heartbeat acknowledgment
                    ws.send(JSON.stringify({ type: MessageType.HEARTBEAT_ACK }));
                    break;

                default:
                    console.warn(`Unknown message type: ${type}`);
                    sendError(ws, 'Unknown message type');
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            sendError(ws, 'Invalid message format');
        }
    });

    // Handle connection close
    ws.addEventListener('close', async () => {
        console.log('WebSocket connection closed');

        // Clean up
        clearInterval(pingInterval);

        // Remove from subscriptions
        if (currentRoomId && currentParticipantId) {
            await handleLeaveRoom(ws, {
                roomId: currentRoomId,
                participantId: currentParticipantId
            });
        }
    });

    // Handle errors
    ws.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
    });

    return response;
}

/**
 * Handle joining a room
 */
async function handleJoinRoom(ws: WebSocket, payload: any) {
    const { roomId, name, participantId } = payload;

    if (!roomId || !name) {
        sendError(ws, 'Room ID and participant name are required');
        return;
    }

    try {
        // Check if the room exists
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { participants: true }
        });

        if (!room) {
            sendError(ws, 'Room not found');
            return;
        }

        // Clean up inactive participants
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        try {
            await prisma.participant.deleteMany({
                where: {
                    roomId: roomId,
                    updatedAt: { lt: thirtySecondsAgo },
                    isHost: false
                }
            });
        } catch (error) {
            console.error('Error cleaning up inactive participants:', error);
        }

        let participant;

        // If participantId is provided, check if the participant exists
        if (participantId) {
            participant = await prisma.participant.findUnique({
                where: {
                    id: participantId,
                    roomId: roomId
                }
            });

            if (participant) {
                // Update participant's last active time
                participant = await prisma.participant.update({
                    where: { id: participantId },
                    data: { lastActive: new Date() }
                });
            }
        }

        // If participant doesn't exist, check if a participant with the same name exists
        if (!participant) {
            const existingParticipant = room.participants.find(p => p.name === name);

            if (existingParticipant) {
                participant = existingParticipant;
            } else {
                // Create a new participant
                participant = await prisma.participant.create({
                    data: {
                        name,
                        roomId,
                        lastActive: new Date()
                    }
                });
            }
        }

        // Subscribe to the room
        if (!roomSubscriptions[roomId]) {
            roomSubscriptions[roomId] = new Map();
        }

        roomSubscriptions[roomId].set(participant.id, ws);

        // Get the updated room data
        const updatedRoom = await prisma.room.findUnique({
            where: { id: roomId },
            include: { participants: true }
        });

        // Send confirmation to the client
        ws.send(JSON.stringify({
            type: MessageType.PARTICIPANT_JOINED,
            payload: {
                roomId,
                participant
            }
        }));

        // Broadcast to all other participants in the room
        broadcastToRoom(roomId, {
            type: MessageType.ROOM_UPDATED,
            payload: {
                roomId,
                room: updatedRoom
            }
        }, participant.id);

    } catch (error) {
        console.error('Error joining room:', error);
        sendError(ws, 'Failed to join room');
    }
}

/**
 * Handle leaving a room
 */
async function handleLeaveRoom(ws: WebSocket, payload: any) {
    const { roomId, participantId } = payload;

    if (!roomId || !participantId) {
        sendError(ws, 'Room ID and participant ID are required');
        return;
    }

    try {
        // Check if the participant exists
        const participant = await prisma.participant.findUnique({
            where: {
                id: participantId,
                roomId: roomId
            }
        });

        if (!participant) {
            sendError(ws, 'Participant not found');
            return;
        }

        const isHost = participant.isHost;

        // Delete the participant
        await prisma.participant.delete({
            where: { id: participantId }
        });

        // Unsubscribe from the room
        if (roomSubscriptions[roomId]) {
            roomSubscriptions[roomId].delete(participantId);

            // If no more participants in the room, clean up the room entry
            if (roomSubscriptions[roomId].size === 0) {
                delete roomSubscriptions[roomId];
            }
        }

        // Check if any participants remain
        const remainingParticipants = await prisma.participant.findMany({
            where: { roomId }
        });

        if (remainingParticipants.length === 0) {
            // If no participants remain, delete the room
            await prisma.room.delete({
                where: { id: roomId }
            });

            // Send confirmation to the client
            ws.send(JSON.stringify({
                type: MessageType.PARTICIPANT_LEFT,
                payload: {
                    roomId,
                    participantId,
                    roomDeleted: true
                }
            }));

            return;
        }

        // If the deleted participant was the host, assign a new host
        if (isHost && remainingParticipants.length > 0) {
            await prisma.participant.update({
                where: { id: remainingParticipants[0].id },
                data: { isHost: true }
            });
        }

        // Get the updated room data
        const updatedRoom = await prisma.room.findUnique({
            where: { id: roomId },
            include: { participants: true }
        });

        // Send confirmation to the client
        ws.send(JSON.stringify({
            type: MessageType.PARTICIPANT_LEFT,
            payload: {
                roomId,
                participantId,
                roomDeleted: false
            }
        }));

        // Broadcast to all other participants in the room
        broadcastToRoom(roomId, {
            type: MessageType.ROOM_UPDATED,
            payload: {
                roomId,
                room: updatedRoom
            }
        });

    } catch (error) {
        console.error('Error leaving room:', error);
        sendError(ws, 'Failed to leave room');
    }
}

/**
 * Handle submitting a vote
 */
async function handleSubmitVote(ws: WebSocket, payload: any) {
    const { roomId, participantId, vote } = payload;

    if (!roomId || !participantId) {
        sendError(ws, 'Room ID and participant ID are required');
        return;
    }

    try {
        // Check if the participant exists
        const participant = await prisma.participant.findUnique({
            where: {
                id: participantId,
                roomId: roomId
            }
        });

        if (!participant) {
            sendError(ws, 'Participant not found');
            return;
        }

        // Update the participant's vote
        await prisma.participant.update({
            where: { id: participantId },
            data: {
                vote,
                lastActive: new Date()
            }
        });

        // Get the updated room data
        const updatedRoom = await prisma.room.findUnique({
            where: { id: roomId },
            include: { participants: true }
        });

        // Send confirmation to the client
        ws.send(JSON.stringify({
            type: MessageType.VOTE_SUBMITTED,
            payload: {
                roomId,
                participantId,
                hasVoted: true
            }
        }));

        // Broadcast to all other participants in the room
        broadcastToRoom(roomId, {
            type: MessageType.ROOM_UPDATED,
            payload: {
                roomId,
                room: updatedRoom
            }
        }, participantId);

    } catch (error) {
        console.error('Error submitting vote:', error);
        sendError(ws, 'Failed to submit vote');
    }
}

/**
 * Handle revealing votes
 */
async function handleRevealVotes(ws: WebSocket, payload: any) {
    const { roomId, participantId } = payload;

    if (!roomId || !participantId) {
        sendError(ws, 'Room ID and participant ID are required');
        return;
    }

    try {
        // Check if the participant exists and is the host
        const participant = await prisma.participant.findUnique({
            where: {
                id: participantId,
                roomId: roomId
            }
        });

        if (!participant) {
            sendError(ws, 'Participant not found');
            return;
        }

        if (!participant.isHost) {
            sendError(ws, 'Only the host can reveal votes');
            return;
        }

        // Update the room to reveal votes
        await prisma.room.update({
            where: { id: roomId },
            data: { isRevealed: true }
        });

        // Get the updated room data
        const updatedRoom = await prisma.room.findUnique({
            where: { id: roomId },
            include: { participants: true }
        });

        // Send confirmation to the client
        ws.send(JSON.stringify({
            type: MessageType.VOTES_REVEALED,
            payload: {
                roomId,
                room: updatedRoom
            }
        }));

        // Broadcast to all other participants in the room
        broadcastToRoom(roomId, {
            type: MessageType.VOTES_REVEALED,
            payload: {
                roomId,
                room: updatedRoom
            }
        }, participantId);

    } catch (error) {
        console.error('Error revealing votes:', error);
        sendError(ws, 'Failed to reveal votes');
    }
}

/**
 * Handle resetting votes
 */
async function handleResetVotes(ws: WebSocket, payload: any) {
    const { roomId, participantId } = payload;

    if (!roomId || !participantId) {
        sendError(ws, 'Room ID and participant ID are required');
        return;
    }

    try {
        // Check if the participant exists and is the host
        const participant = await prisma.participant.findUnique({
            where: {
                id: participantId,
                roomId: roomId
            }
        });

        if (!participant) {
            sendError(ws, 'Participant not found');
            return;
        }

        if (!participant.isHost) {
            sendError(ws, 'Only the host can reset votes');
            return;
        }

        // Reset votes for all participants and set isRevealed to false
        await prisma.room.update({
            where: { id: roomId },
            data: {
                isRevealed: false,
                participants: {
                    updateMany: {
                        where: { roomId },
                        data: { vote: null }
                    }
                }
            }
        });

        // Get the updated room data
        const updatedRoom = await prisma.room.findUnique({
            where: { id: roomId },
            include: { participants: true }
        });

        // Send confirmation to the client
        ws.send(JSON.stringify({
            type: MessageType.VOTES_RESET,
            payload: {
                roomId,
                room: updatedRoom
            }
        }));

        // Broadcast to all other participants in the room
        broadcastToRoom(roomId, {
            type: MessageType.VOTES_RESET,
            payload: {
                roomId,
                room: updatedRoom
            }
        }, participantId);

    } catch (error) {
        console.error('Error resetting votes:', error);
        sendError(ws, 'Failed to reset votes');
    }
}

/**
 * Broadcast a message to all participants in a room
 */
function broadcastToRoom(roomId: string, message: any, excludeParticipantId?: string) {
    if (!roomSubscriptions[roomId]) {
        return;
    }

    const participants = roomSubscriptions[roomId];
    const messageStr = JSON.stringify(message);

    for (const [participantId, ws] of participants.entries()) {
        if (excludeParticipantId && participantId === excludeParticipantId) {
            continue;
        }

        if (ws.readyState === ws.OPEN) {
            ws.send(messageStr);
        }
    }
}

/**
 * Send an error message to the client
 */
function sendError(ws: WebSocket, message: string, code?: string) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
            type: MessageType.ERROR,
            payload: {
                message,
                code
            }
        }));
    }
}
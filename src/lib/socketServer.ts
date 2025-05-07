import { WebSocketServer, WebSocket } from 'ws';
import { MessageType, WebSocketMessage, JoinRoomPayload, VotePayload, CreateStoryPayload, RevealVotesPayload } from './types';
import prisma from './db';

// Map to store connected clients by room ID
const roomClients = new Map<string, Map<string, WebSocket>>();

// Map to store user information by connection
const connections = new Map<WebSocket, { userId: string; roomId: string }>();

// Start WebSocket server
export const startWebSocketServer = () => {
    // Only start the WebSocket server in a server context
    if (typeof window !== 'undefined') return;

    const PORT = process.env.WEBSOCKET_PORT || 3001;
    const wss = new WebSocketServer({ port: Number(PORT) });

    console.log(`WebSocket server started on port ${PORT}`);

    wss.on('connection', (ws: WebSocket) => {
        console.log('New client connected');

        ws.on('message', async (message: string) => {
            try {
                const data: WebSocketMessage = JSON.parse(message);
                console.log(`Received message: ${data.type}`);

                switch (data.type) {
                    case MessageType.JOIN_ROOM:
                        await handleJoinRoom(ws, data.payload);
                        break;
                    case MessageType.LEAVE_ROOM:
                        handleLeaveRoom(ws);
                        break;
                    case MessageType.CREATE_STORY:
                        await handleCreateStory(data.payload);
                        break;
                    case MessageType.VOTE:
                        await handleVote(data.payload);
                        break;
                    case MessageType.REVEAL_VOTES:
                        await handleRevealVotes(data.payload);
                        break;
                    case MessageType.RESET_VOTES:
                        await handleResetVotes(data.payload);
                        break;
                    case MessageType.NEXT_STORY:
                        await handleNextStory(data.payload);
                        break;
                    default:
                        console.error(`Unknown message type: ${data.type}`);
                }
            } catch (error) {
                console.error('Error handling message:', error);
                ws.send(JSON.stringify({
                    type: MessageType.ERROR,
                    payload: { message: 'Error processing your request' }
                }));
            }
        });

        ws.on('close', () => {
            handleLeaveRoom(ws);
            console.log('Client disconnected');
        });
    });

    return wss;
};

// Handle JOIN_ROOM message
const handleJoinRoom = async (ws: WebSocket, payload: JoinRoomPayload) => {
    const { roomId, userId, userName } = payload;

    // Store connection information
    connections.set(ws, { userId, roomId });

    // Add client to room
    if (!roomClients.has(roomId)) {
        roomClients.set(roomId, new Map());
    }
    roomClients.get(roomId)!.set(userId, ws);

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                id: userId,
                name: userName
            }
        });
    }

    // Check if user is already in room
    const roomUser = await prisma.roomUser.findUnique({
        where: {
            userId_roomId: {
                userId,
                roomId
            }
        }
    });

    if (!roomUser) {
        // Add user to room
        await prisma.roomUser.create({
            data: {
                userId,
                roomId,
                isAdmin: false
            }
        });
    }

    // Notify other clients in room
    broadcastToRoom(roomId, {
        type: MessageType.USER_JOINED,
        payload: { userId, userName }
    });

    // Send room data to client
    await sendRoomData(roomId, ws);
};

// Handle LEAVE_ROOM message
const handleLeaveRoom = (ws: WebSocket) => {
    const connectionInfo = connections.get(ws);
    if (!connectionInfo) return;

    const { userId, roomId } = connectionInfo;

    // Remove client from room
    const roomClientMap = roomClients.get(roomId);
    if (roomClientMap) {
        roomClientMap.delete(userId);
        if (roomClientMap.size === 0) {
            roomClients.delete(roomId);
        }
    }

    // Remove connection information
    connections.delete(ws);

    // Notify other clients in room
    broadcastToRoom(roomId, {
        type: MessageType.USER_LEFT,
        payload: { userId }
    });
};

// Handle CREATE_STORY message
const handleCreateStory = async (payload: CreateStoryPayload) => {
    const { roomId, title, description } = payload;

    // Create new story
    const story = await prisma.story.create({
        data: {
            title,
            description: description || '',
            roomId,
            isActive: true,
            isRevealed: false
        }
    });

    // Broadcast room data update
    await broadcastRoomData(roomId);
};

// Handle VOTE message
const handleVote = async (payload: VotePayload) => {
    const { roomId, storyId, userId, value } = payload;

    // Check if vote already exists
    const existingVote = await prisma.vote.findUnique({
        where: {
            userId_storyId: {
                userId,
                storyId
            }
        }
    });

    if (existingVote) {
        // Update existing vote
        await prisma.vote.update({
            where: {
                id: existingVote.id
            },
            data: {
                value
            }
        });
    } else {
        // Create new vote
        await prisma.vote.create({
            data: {
                userId,
                storyId,
                value
            }
        });
    }

    // Broadcast room data update
    await broadcastRoomData(roomId);
};

// Handle REVEAL_VOTES message
const handleRevealVotes = async (payload: RevealVotesPayload) => {
    const { roomId, storyId } = payload;

    // Update story to reveal votes
    await prisma.story.update({
        where: {
            id: storyId
        },
        data: {
            isRevealed: true
        }
    });

    // Broadcast room data update
    await broadcastRoomData(roomId);
};

// Handle RESET_VOTES message
const handleResetVotes = async (payload: RevealVotesPayload) => {
    const { roomId, storyId } = payload;

    // Delete all votes for the story
    await prisma.vote.deleteMany({
        where: {
            storyId
        }
    });

    // Reset story reveal status
    await prisma.story.update({
        where: {
            id: storyId
        },
        data: {
            isRevealed: false
        }
    });

    // Broadcast room data update
    await broadcastRoomData(roomId);
};

// Handle NEXT_STORY message
const handleNextStory = async (payload: { roomId: string, currentStoryId: string }) => {
    const { roomId, currentStoryId } = payload;

    // Mark current story as inactive
    await prisma.story.update({
        where: {
            id: currentStoryId
        },
        data: {
            isActive: false
        }
    });

    // Broadcast room data update
    await broadcastRoomData(roomId);
};

// Send room data to a specific client
const sendRoomData = async (roomId: string, ws: WebSocket) => {
    try {
        // Get room data
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });

        if (!room) {
            ws.send(JSON.stringify({
                type: MessageType.ERROR,
                payload: { message: 'Room not found' }
            }));
            return;
        }

        // Get stories for the room
        const stories = await prisma.story.findMany({
            where: { roomId }
        });

        // Get current active story
        const currentStory = stories.find(story => story.isActive);

        // Get users in the room
        const roomUsers = await prisma.roomUser.findMany({
            where: { roomId },
            include: { user: true }
        });

        // Get votes for the current story
        const votes = currentStory
            ? await prisma.vote.findMany({
                where: { storyId: currentStory.id }
            })
            : [];

        // Send room data to client
        ws.send(JSON.stringify({
            type: MessageType.ROOM_DATA,
            payload: {
                room,
                stories,
                users: roomUsers,
                votes,
                currentStory
            }
        }));
    } catch (error) {
        console.error('Error sending room data:', error);
        ws.send(JSON.stringify({
            type: MessageType.ERROR,
            payload: { message: 'Error fetching room data' }
        }));
    }
};

// Broadcast room data to all clients in a room
const broadcastRoomData = async (roomId: string) => {
    try {
        // Get room data
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });

        if (!room) {
            return;
        }

        // Get stories for the room
        const stories = await prisma.story.findMany({
            where: { roomId }
        });

        // Get current active story
        const currentStory = stories.find(story => story.isActive);

        // Get users in the room
        const roomUsers = await prisma.roomUser.findMany({
            where: { roomId },
            include: { user: true }
        });

        // Get votes for the current story
        const votes = currentStory
            ? await prisma.vote.findMany({
                where: { storyId: currentStory.id }
            })
            : [];

        // Broadcast room data to all clients in the room
        broadcastToRoom(roomId, {
            type: MessageType.ROOM_DATA,
            payload: {
                room,
                stories,
                users: roomUsers,
                votes,
                currentStory
            }
        });
    } catch (error) {
        console.error('Error broadcasting room data:', error);
    }
};

// Broadcast message to all clients in a room
const broadcastToRoom = (roomId: string, message: WebSocketMessage) => {
    const roomClientMap = roomClients.get(roomId);
    if (!roomClientMap) return;

    roomClientMap.forEach((ws) => {
        ws.send(JSON.stringify(message));
    });
};

// Initialize the WebSocket server when this module is imported
if (typeof window === 'undefined') {
    startWebSocketServer();
}
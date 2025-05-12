import { Router, type RouterContext } from "../deps.ts";
import { roomDB, userDB, roomUserDB } from "../db/schema.ts";
import {
    CreateRoomRequest,
    CreateRoomResponse,
    JoinRoomRequest,
    JoinRoomResponse,
    CheckRoomResponse,
    FindRoomByCodeResponse,
    RoomDataResponse
} from "../models/types.ts";

const router = new Router();

// Helper function to validate request body
const validateRequestBody = async <T>(ctx: RouterContext<string>): Promise<T | null> => {
    try {
        const body = ctx.request.body({ type: "json" });
        return await body.value as T;
    } catch (_error) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid request body" };
        return null;
    }
};

// Create a new room
router.post("/rooms", async (ctx: RouterContext<string>) => {
    try {
        const body = await validateRequestBody<CreateRoomRequest>(ctx);
        if (!body) return;

        const { roomName, hostName } = body;

        if (!roomName || !hostName) {
            ctx.response.status = 400;
            ctx.response.body = { error: "Room name and host name are required" };
            return;
        }

        // Generate room code with retry
        let roomCode;
        try {
            roomCode = await roomDB.generateUniqueCode();
        } catch (error) {
            console.error("Error generating room code:", error);
            ctx.response.status = 500;
            ctx.response.body = { error: "Failed to generate room code, please try again" };
            return;
        }

        // Create user
        let user;
        try {
            user = await userDB.create(hostName);
        } catch (error) {
            console.error("Error creating user:", error);
            ctx.response.status = 500;
            ctx.response.body = { error: "Failed to create user, please try again" };
            return;
        }
        const userId = user.id;

        // Create room
        let room;
        try {
            room = await roomDB.create(roomName, roomCode, userId);
        } catch (error) {
            console.error("Error creating room:", error);
            ctx.response.status = 500;
            ctx.response.body = { error: "Failed to create room, please try again" };
            return;
        }
        const roomId = room.id;

        // Add host to room
        try {
            await roomUserDB.addUserToRoom(roomId, userId);
        } catch (error) {
            console.error("Error adding user to room:", error);
            // Even if this fails, we can return the room info since it was created
        }

        const response: CreateRoomResponse = {
            roomId,
            roomCode,
            userId,
            userName: hostName
        };

        ctx.response.status = 201;
        ctx.response.body = response;
    } catch (error) {
        console.error("Error creating room:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to create room" };
    }
});

// Find room by code
router.get("/rooms/code/:code", async (ctx: RouterContext<string>) => {
    try {
        const code = ctx.params.code;

        if (!code) {
            ctx.response.status = 400;
            ctx.response.body = { error: "Room code is required" };
            return;
        }

        const room = await roomDB.findByCode(code);

        const response: FindRoomByCodeResponse = {
            exists: !!room,
            roomId: room ? room.id : null
        };

        ctx.response.body = response;
    } catch (error) {
        console.error("Error finding room:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to find room" };
    }
});

// Check if room exists
router.get("/rooms/:id/check", async (ctx: RouterContext<string>) => {
    try {
        const id = ctx.params.id;

        if (!id) {
            ctx.response.status = 400;
            ctx.response.body = { error: "Room ID is required" };
            return;
        }

        const room = await roomDB.findById(id);

        const response: CheckRoomResponse = {
            exists: !!room && room.is_active,
            roomId: room ? room.id : null
        };

        ctx.response.body = response;
    } catch (error) {
        console.error("Error checking room:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to check room" };
    }
});

// Join a room
router.post("/rooms/:id/join", async (ctx: RouterContext<string>) => {
    try {
        const roomId = ctx.params.id;
        const body = await validateRequestBody<JoinRoomRequest>(ctx);
        if (!body) return;

        const { userName } = body;

        if (!roomId || !userName) {
            ctx.response.status = 400;
            ctx.response.body = { error: "Room ID and user name are required" };
            return;
        }

        // Check if room exists and is active
        const room = await roomDB.findById(roomId);
        if (!room || !room.is_active) {
            ctx.response.status = 404;
            ctx.response.body = { error: "Room not found or inactive" };
            return;
        }

        // Create user
        const user = await userDB.create(userName);
        const userId = user.id;

        // Add user to room
        await roomUserDB.addUserToRoom(roomId, userId);

        const response: JoinRoomResponse = {
            userId,
            userName
        };

        ctx.response.body = response;
    } catch (error) {
        console.error("Error joining room:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to join room" };
    }
});

// Get room data
router.get("/rooms/:id", async (ctx: RouterContext<string>) => {
    try {
        const roomId = ctx.params.id;

        if (!roomId) {
            ctx.response.status = 400;
            ctx.response.body = { error: "Room ID is required" };
            return;
        }

        // Get room details
        const room = await roomDB.findById(roomId);
        if (!room || !room.is_active) {
            ctx.response.status = 404;
            ctx.response.body = { error: "Room not found or inactive" };
            return;
        }

        // Get users in room
        const users = await roomDB.getUsers(roomId);

        const response: RoomDataResponse = {
            room: {
                id: room.id,
                name: room.name,
                roomCode: room.room_code,
                hostId: room.host_id,
                isActive: room.is_active,
                createdAt: room.created_at.toISOString()
            },
            users: users.map(user => ({
                id: user.id,
                name: user.name,
                createdAt: user.created_at.toISOString()
            }))
        };

        ctx.response.body = response;
    } catch (error) {
        console.error("Error getting room data:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to get room data" };
    }
});

export { router as roomsRouter };
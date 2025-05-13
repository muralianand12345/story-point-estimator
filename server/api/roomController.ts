import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { roomStore } from "../db/store.ts";

// Create a new room
export const createRoom = (context: Context) => {
    try {
        const room = roomStore.createRoom();

        context.response.status = 200;
        context.response.body = {
            roomId: room.id
        };
    } catch (error) {
        console.error("Error creating room:", error);
        context.response.status = 500;
        context.response.body = {
            error: "Failed to create room"
        };
    }
};

// Validate if a room exists
export const validateRoom = (context: Context) => {
    try {
        const roomId = context.request.url.searchParams.get("roomId");

        if (!roomId) {
            context.response.status = 400;
            context.response.body = {
                error: "Room ID is required"
            };
            return;
        }

        const room = roomStore.getRoom(roomId);

        if (!room) {
            context.response.status = 404;
            context.response.body = {
                error: "Room not found"
            };
            return;
        }

        context.response.status = 200;
        context.response.body = {
            valid: true
        };
    } catch (error) {
        console.error("Error validating room:", error);
        context.response.status = 500;
        context.response.body = {
            error: "Failed to validate room"
        };
    }
};

// Get room details
export const getRoomDetails = (context: Context) => {
    try {
        const roomId = context.request.url.searchParams.get("roomId");

        if (!roomId) {
            context.response.status = 400;
            context.response.body = {
                error: "Room ID is required"
            };
            return;
        }

        const room = roomStore.getRoom(roomId);

        if (!room) {
            context.response.status = 404;
            context.response.body = {
                error: "Room not found"
            };
            return;
        }

        context.response.status = 200;
        context.response.body = {
            room
        };
    } catch (error) {
        console.error("Error getting room details:", error);
        context.response.status = 500;
        context.response.body = {
            error: "Failed to get room details"
        };
    }
};
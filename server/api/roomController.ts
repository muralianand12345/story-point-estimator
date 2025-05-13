import { Context } from "oak";
import { roomStore } from "../db/store.ts";
import { Room } from "../types/room.ts";

// Response types
interface CreateRoomResponse {
    roomId: string;
}

interface ValidateRoomResponse {
    valid: boolean;
}

interface RoomDetailsResponse {
    room: Room;
}

interface ErrorResponse {
    error: string;
}

// Create a new room
export const createRoom = (context: Context): void => {
    try {
        const room = roomStore.createRoom();

        context.response.status = 200;
        context.response.body = {
            roomId: room.id
        } as CreateRoomResponse;
    } catch (error) {
        console.error("Error creating room:", error);
        context.response.status = 500;
        context.response.body = {
            error: "Failed to create room"
        } as ErrorResponse;
    }
};

// Validate if a room exists
export const validateRoom = (context: Context): void => {
    try {
        const roomId = context.request.url.searchParams.get("roomId");

        if (!roomId) {
            context.response.status = 400;
            context.response.body = {
                error: "Room ID is required"
            } as ErrorResponse;
            return;
        }

        const room = roomStore.getRoom(roomId);

        if (!room) {
            context.response.status = 404;
            context.response.body = {
                error: "Room not found"
            } as ErrorResponse;
            return;
        }

        context.response.status = 200;
        context.response.body = {
            valid: true
        } as ValidateRoomResponse;
    } catch (error) {
        console.error("Error validating room:", error);
        context.response.status = 500;
        context.response.body = {
            error: "Failed to validate room"
        } as ErrorResponse;
    }
};

// Get room details
export const getRoomDetails = (context: Context): void => {
    try {
        const roomId = context.request.url.searchParams.get("roomId");

        if (!roomId) {
            context.response.status = 400;
            context.response.body = {
                error: "Room ID is required"
            } as ErrorResponse;
            return;
        }

        const room = roomStore.getRoom(roomId);

        if (!room) {
            context.response.status = 404;
            context.response.body = {
                error: "Room not found"
            } as ErrorResponse;
            return;
        }

        context.response.status = 200;
        context.response.body = {
            room
        } as RoomDetailsResponse;
    } catch (error) {
        console.error("Error getting room details:", error);
        context.response.status = 500;
        context.response.body = {
            error: "Failed to get room details"
        } as ErrorResponse;
    }
};
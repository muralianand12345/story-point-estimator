import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusher = process.env.PUSHER_APP_ID
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.PUSHER_CLUSTER!,
        useTLS: true,
    })
    : null;

// Client-side Pusher instance
export const pusherClient = process.env.NEXT_PUBLIC_PUSHER_KEY
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
    : null;

// Event types
export const EVENTS = {
    ROOM_UPDATED: 'room-updated',
    PARTICIPANT_JOINED: 'participant-joined',
    PARTICIPANT_LEFT: 'participant-left',
    VOTE_SUBMITTED: 'vote-submitted',
    VOTES_REVEALED: 'votes-revealed',
    VOTES_RESET: 'votes-reset',
};

// Helper function to trigger events
export const triggerRoomEvent = (
    roomId: string,
    event: string,
    data: any
): void => {
    if (!pusher) return;

    try {
        pusher.trigger(`room-${roomId}`, event, data);
    } catch (error) {
        console.error(`Error triggering event ${event}:`, error);
    }
};
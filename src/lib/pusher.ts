// This is a dummy implementation to prevent breaking changes
// We're not using Pusher anymore, but some imports might still reference this file

// Event types
export const EVENTS = {
    ROOM_UPDATED: 'room-updated',
    PARTICIPANT_JOINED: 'participant-joined',
    PARTICIPANT_LEFT: 'participant-left',
    VOTE_SUBMITTED: 'vote-submitted',
    VOTES_REVEALED: 'votes-revealed',
    VOTES_RESET: 'votes-reset',
};

// No-op function to replace the pusher trigger
export const triggerRoomEvent = (
    _roomId: string,
    _event: string,
    _data: Record<string, unknown>
): void => {
    return;
};

// Server-side Pusher instance (null)
export const pusher = null;

// Client-side Pusher instance (null)
export const pusherClient = null;
export type User = {
    id: string;
    name: string;
};

export type Room = {
    id: string;
    name: string;
    roomCode: string;
    createdById: string;
    isActive: boolean;
};

export type Story = {
    id: string;
    title: string;
    description?: string;
    roomId: string;
    isActive: boolean;
    isRevealed: boolean;
};

export type Vote = {
    id: string;
    userId: string;
    storyId: string;
    value: string;
};

export type RoomUser = {
    id: string;
    userId: string;
    roomId: string;
    isAdmin: boolean;
    user: User;
};

// WebSocket message types
export enum MessageType {
    JOIN_ROOM = 'JOIN_ROOM',
    LEAVE_ROOM = 'LEAVE_ROOM',
    CREATE_STORY = 'CREATE_STORY',
    VOTE = 'VOTE',
    REVEAL_VOTES = 'REVEAL_VOTES',
    RESET_VOTES = 'RESET_VOTES',
    NEXT_STORY = 'NEXT_STORY',
    USER_JOINED = 'USER_JOINED',
    USER_LEFT = 'USER_LEFT',
    ERROR = 'ERROR',
    ROOM_DATA = 'ROOM_DATA',
}

export type WebSocketMessage = {
    type: MessageType;
    payload: any;
};

export type JoinRoomPayload = {
    roomId: string;
    userId: string;
    userName: string;
};

export type CreateStoryPayload = {
    roomId: string;
    title: string;
    description?: string;
};

export type VotePayload = {
    roomId: string;
    storyId: string;
    userId: string;
    value: string;
};

export type RevealVotesPayload = {
    roomId: string;
    storyId: string;
};

export type RoomDataPayload = {
    room: Room;
    stories: Story[];
    users: RoomUser[];
    votes: Vote[];
    currentStory?: Story;
};
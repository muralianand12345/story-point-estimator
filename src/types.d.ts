export interface IContext {
	params: Promise<{
		id: string;
		participantsId?: string;
	}>;
}

//--------------WEBSOCKET------------------//

export interface WebSocketMessage {
	type: MessageType;
	payload?: any;
}

export interface JoinRoomMessage extends WebSocketMessage {
	type: MessageType.JOIN_ROOM;
	payload: {
		roomId: string;
		name: string;
		participantId?: string; // Optional, for rejoining
	};
}

export interface LeaveRoomMessage extends WebSocketMessage {
	type: MessageType.LEAVE_ROOM;
	payload: {
		roomId: string;
		participantId: string;
	};
}

export interface SubmitVoteMessage extends WebSocketMessage {
	type: MessageType.SUBMIT_VOTE;
	payload: {
		roomId: string;
		participantId: string;
		vote: string;
	};
}

export interface RevealVotesMessage extends WebSocketMessage {
	type: MessageType.REVEAL_VOTES;
	payload: {
		roomId: string;
		participantId: string; // To verify the requester is a host
	};
}

export interface ResetVotesMessage extends WebSocketMessage {
	type: MessageType.RESET_VOTES;
	payload: {
		roomId: string;
		participantId: string; // To verify the requester is a host
	};
}

export interface HeartbeatMessage extends WebSocketMessage {
	type: MessageType.HEARTBEAT;
	payload: {
		roomId: string;
		participantId: string;
	};
}

export interface ParticipantJoinedMessage extends WebSocketMessage {
	type: MessageType.PARTICIPANT_JOINED;
	payload: {
		roomId: string;
		participant: any; // Using the Participant type from your API
	};
}

export interface ParticipantLeftMessage extends WebSocketMessage {
	type: MessageType.PARTICIPANT_LEFT;
	payload: {
		roomId: string;
		participantId: string;
	};
}

export interface VoteSubmittedMessage extends WebSocketMessage {
	type: MessageType.VOTE_SUBMITTED;
	payload: {
		roomId: string;
		participantId: string;
		hasVoted: boolean; // Don't reveal actual vote until all have voted
	};
}

export interface VotesRevealedMessage extends WebSocketMessage {
	type: MessageType.VOTES_REVEALED;
	payload: {
		roomId: string;
		room: any; // Using the Room type from your API with votes revealed
	};
}

export interface VotesResetMessage extends WebSocketMessage {
	type: MessageType.VOTES_RESET;
	payload: {
		roomId: string;
		room: any; // Using the Room type from your API with votes reset
	};
}

export interface RoomUpdatedMessage extends WebSocketMessage {
	type: MessageType.ROOM_UPDATED;
	payload: {
		roomId: string;
		room: any; // Using the Room type from your API
	};
}

export interface ErrorMessage extends WebSocketMessage {
	type: MessageType.ERROR;
	payload: {
		message: string;
		code?: string;
	};
}

export interface HeartbeatAckMessage extends WebSocketMessage {
	type: MessageType.HEARTBEAT_ACK;
	payload?: null;
}

export type WebSocketMessageUnion =
	| JoinRoomMessage
	| LeaveRoomMessage
	| ParticipantJoinedMessage
	| ParticipantLeftMessage
	| SubmitVoteMessage
	| VoteSubmittedMessage
	| RevealVotesMessage
	| VotesRevealedMessage
	| ResetVotesMessage
	| VotesResetMessage
	| RoomUpdatedMessage
	| ErrorMessage
	| HeartbeatMessage
	| HeartbeatAckMessage;

export interface WebSocketEventMap {
	connect: () => void;
	disconnect: (code: number, reason: string) => void;
	reconnecting: (attempt: number) => void;
	reconnect: () => void;
	reconnect_failed: () => void;
	error: (error: Error) => void;
	message: (message: WebSocketMessageUnion) => void;
	[key: string]: ((...args: any[]) => void);
}
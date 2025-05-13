export interface User {
    id: string;
    name: string;
    isHost: boolean;
    vote: string | null;
}

export interface VoteHistory {
    id: string;
    issueName: string;
    votes: {
        userId: string;
        userName: string;
        vote: string;
    }[];
    finalScore?: string;
    timestamp: number;
}

export interface Room {
    id: string;
    hostId: string;
    issueName: string;
    users: User[];
    votingEnabled: boolean;
    votesRevealed: boolean;
    voteHistory: VoteHistory[];
}

export type VoteValue = '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?' | 'coffee';
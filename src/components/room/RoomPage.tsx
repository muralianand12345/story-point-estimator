"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Grid,
    Box,
    Typography,
    useTheme,
    CircularProgress,
    Button
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import UserNameDialog from './UserNameDialog';
import UsersList from './UsersList';
import VotingArea from './VotingArea';
import RoomControls from './RoomControls';
import VoteHistoryDialog from './VoteHistoryDialog';
import KickUserDialog from './KickUserDialog';
import VoteResultSummary from './VoteResultSummary';
import { useWebSocket } from '../../hooks/useWebSocket';
import { User, Room, VoteValue, VoteHistory } from '../../types/room';

interface WebSocketMessage {
    type: string;
    payload: any;
}

const RoomPage = () => {
    const theme = useTheme();
    const router = useRouter();
    const params = useParams();
    const roomId = params?.roomId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showNameDialog, setShowNameDialog] = useState(true);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [kickUserDialog, setKickUserDialog] = useState<{ open: boolean; userId: string; userName: string }>({
        open: false,
        userId: '',
        userName: '',
    });

    const [userId] = useState<string>(() => {
        // Generate a user ID or get from localStorage
        const storedId = localStorage.getItem('userId');
        if (storedId) return storedId;

        const newId = uuidv4();
        localStorage.setItem('userId', newId);
        return newId;
    });

    const [userName, setUserName] = useState<string>(() => {
        return localStorage.getItem('userName') || '';
    });

    const [room, setRoom] = useState<Room | null>(null);
    const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);

    // Calculate WebSocket URL based on environment
    const wsUrl = typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/server/ws/rooms/${roomId}`
        : '';

    const { isConnected, sendMessage } = useWebSocket(wsUrl, {
        onOpen: () => {
            console.log('WebSocket connected');
            // If we have a username, join the room
            if (userName) {
                sendMessage({
                    type: 'join_room',
                    payload: {
                        roomId,
                        userId,
                        userName
                    }
                });
            }
        },
        onMessage: (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);

                switch (message.type) {
                    case 'room_state':
                        setRoom(message.payload.room);
                        setIsLoading(false);
                        break;

                    case 'error':
                        setError(message.payload.message);
                        setIsLoading(false);
                        break;

                    default:
                        console.log('Unknown message type:', message.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        },
        onClose: () => {
            console.log('WebSocket disconnected');
        },
        onError: (event) => {
            console.error('WebSocket error:', event);
            setError('Connection error. Please try again.');
            setIsLoading(false);
        },
        reconnectAttempts: 5,
        reconnectInterval: 3000
    });

    useEffect(() => {
        if (!roomId) {
            router.push('/');
        }
    }, [roomId, router]);

    const handleNameSubmit = (name: string) => {
        setUserName(name);
        localStorage.setItem('userName', name);
        setShowNameDialog(false);

        // Join the room
        if (isConnected) {
            sendMessage({
                type: 'join_room',
                payload: {
                    roomId,
                    userId,
                    userName: name
                }
            });
        }
    };

    const handleVote = (vote: VoteValue) => {
        if (!room?.votingEnabled) return;

        setSelectedVote(vote);
        sendMessage({
            type: 'vote',
            payload: {
                roomId,
                userId,
                vote
            }
        });
    };

    const handleRevealVotes = () => {
        sendMessage({
            type: 'reveal_votes',
            payload: {
                roomId,
                userId
            }
        });
    };

    const handleResetVotes = () => {
        sendMessage({
            type: 'reset_votes',
            payload: {
                roomId,
                userId
            }
        });
        setSelectedVote(null);
    };

    const handleIssueNameChange = (name: string) => {
        sendMessage({
            type: 'update_issue_name',
            payload: {
                roomId,
                userId,
                issueName: name
            }
        });
    };

    const handleKickUser = (userId: string) => {
        const user = room?.users.find(u => u.id === userId);
        if (!user) return;

        setKickUserDialog({
            open: true,
            userId,
            userName: user.name
        });
    };

    const confirmKickUser = () => {
        sendMessage({
            type: 'kick_user',
            payload: {
                roomId,
                userId,
                targetUserId: kickUserDialog.userId
            }
        });

        setKickUserDialog({
            open: false,
            userId: '',
            userName: ''
        });
    };

    const handleLeaveRoom = () => {
        sendMessage({
            type: 'leave_room',
            payload: {
                roomId,
                userId
            }
        });

        router.push('/');
    };

    // Find current user in room
    const currentUser = room?.users.find(u => u.id === userId);

    // Check if all users have voted
    const allVoted = room?.users.every(user => user.vote !== null) || false;

    // Determine if current user is host
    const isHost = currentUser?.isHost || false;

    // Get user's vote from room state
    useEffect(() => {
        if (room) {
            const userVote = room.users.find(u => u.id === userId)?.vote as VoteValue;
            setSelectedVote(userVote);
        }
    }, [room, userId]);

    if (isLoading) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: 2
            }}>
                <CircularProgress size={60} />
                <Typography variant="h6">
                    Connecting to room...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                flexDirection: 'column',
                p: 3
            }}>
                <Typography variant="h5" color="error" gutterBottom>
                    Error
                </Typography>
                <Typography paragraph align="center">
                    {error}
                </Typography>
                <Box sx={{ mt: 3 }}>
                    <Button variant="contained" onClick={() => router.push('/')}>
                        Return to Home
                    </Button>
                </Box>
            </Box>
        );
    }

    if (!room) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: 2
            }}>
                <Typography variant="h5" color="error" gutterBottom>
                    Room not found
                </Typography>
                <Button variant="contained" onClick={() => router.push('/')}>
                    Return to Home
                </Button>
            </Box>
        );
    }

    return (
        <>
            <UserNameDialog
                open={showNameDialog}
                onSubmit={handleNameSubmit}
            />

            <VoteHistoryDialog
                open={showHistoryDialog}
                onClose={() => setShowHistoryDialog(false)}
                history={room.voteHistory}
            />

            <KickUserDialog
                open={kickUserDialog.open}
                onClose={() => setKickUserDialog({ open: false, userId: '', userName: '' })}
                onConfirm={confirmKickUser}
                userName={kickUserDialog.userName}
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <RoomControls
                    roomId={roomId}
                    onShowHistory={() => setShowHistoryDialog(true)}
                    onLeaveRoom={handleLeaveRoom}
                />

                {room.votesRevealed && (
                    <VoteResultSummary
                        users={room.users}
                        votesRevealed={room.votesRevealed}
                    />
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <VotingArea
                            issueName={room.issueName}
                            onIssueNameChange={handleIssueNameChange}
                            isHost={isHost}
                            votesRevealed={room.votesRevealed}
                            selectedVote={selectedVote}
                            onVote={handleVote}
                            onRevealVotes={handleRevealVotes}
                            onResetVotes={handleResetVotes}
                            votingEnabled={room.votingEnabled}
                            allVoted={allVoted}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <UsersList
                            users={room.users}
                            currentUserId={userId}
                            isHost={isHost}
                            votesRevealed={room.votesRevealed}
                            onKickUser={handleKickUser}
                        />
                    </Grid>
                </Grid>
            </Container>
        </>
    );
};

export default RoomPage;
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Grid,
    CircularProgress,
    Typography,
    Alert,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import RoomHeader from '@/components/room/RoomHeader';
import UserList from '@/components/room/UserList';
import socketService from '@/lib/socketService';
import VotingArea from '@/components/room/VotingArea';
import { Room, User, SocketEvent } from '@/types';
import apiService from '@/lib/apiService';

const RoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const router = useRouter();
    const theme = useTheme();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [room, setRoom] = useState<Room | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [userId, setUserId] = useState<string>('');
    const [confirmLeaveDialog, setConfirmLeaveDialog] = useState<boolean>(false);

    // Initialize user data from localStorage
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');

        if (!storedUserId) {
            router.push(`/room/join/${roomId}`);
            return;
        }

        setUserId(storedUserId);
    }, [roomId, router]);

    // Fetch room data
    useEffect(() => {
        const fetchRoomData = async () => {
            if (!userId) return;

            try {
                const data = await apiService.getRoomData(roomId as string);
                setRoom(data.room);
                setUsers(data.users);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching room data:', error);
                setError('Failed to load room data');
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchRoomData();
        }
    }, [roomId, userId]);

    const safeRoomId = Array.isArray(roomId) ? roomId[0] : roomId as string;

    // Handle user joined callback with proper typing
    const handleUserJoined = useCallback(async (joinedUserId: string) => {
        // First, update immediately with available data
        if (joinedUserId) {
            // Try to get user info from the joined event first
            const existingUsers = [...users];
            const userExists = existingUsers.some(user => user.id === joinedUserId);

            if (!userExists) {
                // Optimistically add a placeholder user while waiting for full data
                console.log(`User ${joinedUserId} joined, adding placeholder`);
                setUsers(prev => [
                    ...prev,
                    { id: joinedUserId, name: "New user...", createdAt: new Date().toISOString() }
                ]);
            }
        }

        // Then fetch complete data for accuracy
        try {
            const data = await apiService.getRoomData(safeRoomId);
            setRoom(data.room);
            setUsers(data.users);
        } catch (error) {
            console.error('Error updating users after join:', error);
        }
    }, [safeRoomId, users]);

    // Handle user left callback with proper typing
    const handleUserLeft = useCallback(async (leftUserId: string) => {
        try {
            const data = await apiService.getRoomData(safeRoomId);
            setRoom(data.room);
            setUsers(data.users);
        } catch (error) {
            console.error('Error updating users after leave:', error);
        }
    }, [safeRoomId]);

    // Handle host changed callback with proper typing
    const handleHostChanged = useCallback((newHostId: string) => {
        setRoom(currentRoom => {
            if (currentRoom) {
                return { ...currentRoom, hostId: newHostId };
            }
            return currentRoom;
        });
    }, []);

    // Handle kicked callback
    const handleKicked = useCallback(() => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');

        // Navigate back to home
        router.push('/');
    }, [router]);

    // Initialize socket connection and register event handlers
    useEffect(() => {
        if (!userId || !safeRoomId) return;

        // Connect to socket
        socketService.connect(safeRoomId, userId);

        // Register event listeners
        socketService.on(SocketEvent.USER_JOINED, handleUserJoined);
        socketService.on(SocketEvent.USER_LEFT, handleUserLeft);
        socketService.on(SocketEvent.HOST_CHANGED, handleHostChanged);
        socketService.on(SocketEvent.KICKED, handleKicked);

        // Cleanup on unmount
        return () => {
            socketService.off(SocketEvent.USER_JOINED);
            socketService.off(SocketEvent.USER_LEFT);
            socketService.off(SocketEvent.HOST_CHANGED);
            socketService.off(SocketEvent.KICKED);
            socketService.disconnect();
        };
    }, [safeRoomId, userId, handleUserJoined, handleUserLeft, handleHostChanged, handleKicked]);

    // Setup auto-refresh timer - polls for room state periodically
    useEffect(() => {
        if (!safeRoomId || isLoading) return;

        const refreshInterval = setInterval(async () => {
            if (socketService.isConnected()) {
                try {
                    const data = await apiService.getRoomData(safeRoomId);

                    // Only update if there's a change
                    if (JSON.stringify(data.users) !== JSON.stringify(users)) {
                        setUsers(data.users);
                    }

                    if (data.room && room && data.room.hostId !== room.hostId) {
                        setRoom(data.room);
                    }
                } catch (error) {
                    console.error('Error refreshing room data:', error);
                }
            }
        }, 15000); // Every 15 seconds

        return () => clearInterval(refreshInterval);
    }, [safeRoomId, room, users, isLoading]);

    const handleKickUser = (kickUserId: string) => {
        if (userId === room?.hostId) {
            socketService.kickUser(kickUserId);
        }
    };

    const openLeaveDialog = () => {
        setConfirmLeaveDialog(true);
    };

    const closeLeaveDialog = () => {
        setConfirmLeaveDialog(false);
    };

    const handleLeaveRoom = () => {
        closeLeaveDialog();

        // Clear user data
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');

        // Disconnect socket
        socketService.leaveRoom();

        // Redirect to home
        router.push('/');
    };

    if (isLoading) {
        return (
            <Container>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh'
                }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Loading room...
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (error || !room) {
        return (
            <Container>
                <Box sx={{ mt: 4 }}>
                    <Alert severity="error">{error || 'Room not found'}</Alert>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body1" gutterBottom>
                            The room you're trying to access doesn't exist or is no longer active.
                        </Typography>
                        <Typography
                            variant="body2"
                            color="primary"
                            sx={{ cursor: 'pointer', mt: 1 }}
                            onClick={() => router.push('/')}
                        >
                            Create a new room
                        </Typography>
                    </Box>
                </Box>
            </Container>
        );
    }

    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/room/join/${roomId}`
        : '';

    return (
        <Container
            maxWidth="lg"
            sx={{
                py: 4,
                minHeight: '100vh',
                backgroundColor: 'transparent'
            }}
        >
            <RoomHeader
                roomName={room.name}
                roomCode={room.roomCode}
                inviteLink={inviteLink}
                onLeaveRoom={openLeaveDialog}
            />

            <Grid container spacing={3}>
                {/* Main estimation area */}
                <Grid item xs={12} md={8}>
                    <VotingArea
                        users={users}
                        currentUserId={userId}
                        isHost={userId === room.hostId}
                        roomId={safeRoomId}
                    />
                </Grid>

                {/* User list */}
                <Grid item xs={12} md={4}>
                    <UserList
                        users={users}
                        currentUserId={userId}
                        hostId={room.hostId}
                        onKickUser={handleKickUser}
                    />
                </Grid>
            </Grid>

            {/* Leave room confirmation dialog */}
            <Dialog
                open={confirmLeaveDialog}
                onClose={closeLeaveDialog}
                aria-labelledby="leave-dialog-title"
                aria-describedby="leave-dialog-description"
            >
                <DialogTitle id="leave-dialog-title">
                    Leave Room?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="leave-dialog-description">
                        Are you sure you want to leave this room? If you're the host, hosting will be transferred to another participant.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeLeaveDialog}>Cancel</Button>
                    <Button onClick={handleLeaveRoom} color="error" variant="contained">
                        Leave Room
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default RoomPage;
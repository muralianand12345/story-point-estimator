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
    useMediaQuery,
    Snackbar
} from '@mui/material';
import RoomHeader from '@/components/room/RoomHeader';
import UserList from '@/components/room/UserList';
import socketService from '@/lib/socketService';
import VotingArea from '@/components/room/VotingArea';
import { Room, User, SocketEvent } from '@/types';
import apiService from '@/lib/apiService';
import Debug from '@/components/room/DebugPanel';

const RoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [room, setRoom] = useState<Room | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [userId, setUserId] = useState<string>('');
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [notification, setNotification] = useState<{ message: string, severity: 'success' | 'error' | 'info' | 'warning' } | null>(null);

    // Initialize user data from localStorage
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');

        if (!storedUserId) {
            router.push(`/room/join/${roomId}`);
            return;
        }

        setUserId(storedUserId);
    }, [roomId, router]);

    // Notification helper
    const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setNotification({ message, severity });
    };

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
                showNotification('Failed to load room data', 'error');
            }
        };

        if (userId) {
            fetchRoomData();
        }
    }, [roomId, userId]);

    const safeRoomId = Array.isArray(roomId) ? roomId[0] : roomId as string;

    // Handle user joined callback with proper typing
    const handleUserJoined = useCallback(async (joinedUserId: string) => {
        console.log(`User joined event received: ${joinedUserId}`);

        try {
            const data = await apiService.getRoomData(safeRoomId);
            setRoom(data.room);
            setUsers(data.users);
            showNotification('A user has joined the room', 'info');
        } catch (error) {
            console.error('Error updating users after join:', error);
        }
    }, [safeRoomId]);

    // Handle user left callback with proper typing
    const handleUserLeft = useCallback(async (leftUserId: string) => {
        console.log(`User left event received: ${leftUserId}`);

        try {
            const data = await apiService.getRoomData(safeRoomId);
            setRoom(data.room);
            setUsers(data.users);
            showNotification('A user has left the room', 'info');
        } catch (error) {
            console.error('Error updating users after leave:', error);
        }
    }, [safeRoomId]);

    // Handle host changed callback with proper typing
    const handleHostChanged = useCallback((newHostId: string) => {
        console.log(`Host changed event received: ${newHostId}`);

        setRoom(currentRoom => {
            if (currentRoom) {
                const updatedRoom = { ...currentRoom, hostId: newHostId };
                showNotification('Room host has changed', 'info');
                return updatedRoom;
            }
            return currentRoom;
        });
    }, []);

    // Handle kicked callback
    const handleKicked = useCallback(() => {
        console.log('You have been kicked from the room');

        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        showNotification('You have been kicked from the room', 'error');

        // Navigate back to home
        setTimeout(() => {
            router.push('/');
        }, 2000);
    }, [router]);

    // Initialize socket connection and register event handlers
    useEffect(() => {
        if (!userId || !safeRoomId) return;

        console.log(`Initializing socket connection: userId=${userId}, roomId=${safeRoomId}`);

        // Connect to socket
        const socketInstance = socketService.connect(safeRoomId, userId);
        setSocket(socketInstance);

        // Register event listeners
        socketService.on(SocketEvent.USER_JOINED, handleUserJoined);
        socketService.on(SocketEvent.USER_LEFT, handleUserLeft);
        socketService.on(SocketEvent.HOST_CHANGED, handleHostChanged);
        socketService.on(SocketEvent.KICKED, handleKicked);

        // For connection status updates
        socketService.on('connection', (status) => {
            console.log('Connection status update:', status);

            if (status.status === 'connected') {
                showNotification('Connected to room', 'success');
            } else if (status.status === 'disconnected') {
                showNotification('Disconnected from room', 'error');
            } else if (status.status === 'reconnecting') {
                showNotification(`Reconnecting... Attempt ${status.attempt}/${status.maxAttempts}`, 'warning');
            } else if (status.status === 'reconnection_failed') {
                showNotification('Failed to reconnect to room', 'error');
            }
        });

        // Cleanup on unmount
        return () => {
            socketService.off(SocketEvent.USER_JOINED);
            socketService.off(SocketEvent.USER_LEFT);
            socketService.off(SocketEvent.HOST_CHANGED);
            socketService.off(SocketEvent.KICKED);
            socketService.off('connection');
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
            showNotification('User has been kicked from the room', 'success');
        }
    };

    const handleLeaveRoom = () => {
        // Show notification
        showNotification('Leaving room...', 'info');

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
                onLeaveRoom={handleLeaveRoom}
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

            {/* Debug panel */}
            {/* {isMobile ? (
                <Box sx={{ mt: 2 }}>
                    <Debug roomId={safeRoomId} userId={userId} />
                </Box>
            ) : (
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                        <Debug roomId={safeRoomId} userId={userId} />
                    </Grid>
                </Grid>
            )} */}

            {/* Notification system */}
            <Snackbar
                open={notification !== null}
                autoHideDuration={4000}
                onClose={() => setNotification(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {notification ? (
                    <Alert
                        onClose={() => setNotification(null)}
                        severity={notification.severity}
                        elevation={6}
                        variant="filled"
                    >
                        {notification.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </Container>
    );
};

export default RoomPage;
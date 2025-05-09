'use client';

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
    useMediaQuery
} from '@mui/material';
import RoomHeader from '@/components/room/RoomHeader';
import UserList from '@/components/room/UserList';
import socketService from '@/lib/socketService';
import VotingArea from '@/components/room/VotingArea';
import { Room, User, SocketEvent } from '@/types';

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
    const [isConnected, setIsConnected] = useState<boolean>(false);

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
                const response = await fetch(`/api/room/${roomId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Room not found or inactive');
                        return;
                    }
                    throw new Error('Failed to fetch room data');
                }

                const data = await response.json();
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

    // Create handler callbacks
    const handleUserJoined = useCallback(async () => {
        try {
            const response = await fetch(`/api/room/${roomId}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error updating users after join:', error);
        }
    }, [roomId]);

    const handleUserLeft = useCallback(async (leftUserId: string) => {
        try {
            const response = await fetch(`/api/room/${roomId}`);
            if (response.ok) {
                const data = await response.json();
                setRoom(data.room);
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error updating users after leave:', error);
        }
    }, [roomId]);

    const handleHostChanged = useCallback((newHostId: string) => {
        if (room) {
            setRoom(prevRoom => ({
                ...prevRoom!,
                hostId: newHostId
            }));
        }
    }, [room]);

    const handleKicked = useCallback(() => {
        // Clear user data and redirect to home
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        router.push('/');
    }, [router]);

    const handleConnect = useCallback(() => {
        setIsConnected(true);
    }, []);

    const handleDisconnect = useCallback(() => {
        setIsConnected(false);
    }, []);

    // Initialize socket connection
    useEffect(() => {
        if (!userId || !roomId || !room) return;

        // Connect to socket
        socketService.connect(roomId as string, userId);

        // Set up socket event listeners
        socketService.on('connect', handleConnect);
        socketService.on('disconnect', handleDisconnect);
        socketService.on(SocketEvent.USER_JOINED, handleUserJoined);
        socketService.on(SocketEvent.USER_LEFT, handleUserLeft);
        socketService.on(SocketEvent.HOST_CHANGED, handleHostChanged);
        socketService.on(SocketEvent.KICKED, handleKicked);

        // Cleanup on unmount
        return () => {
            socketService.off('connect', handleConnect);
            socketService.off('disconnect', handleDisconnect);
            socketService.off(SocketEvent.USER_JOINED, handleUserJoined);
            socketService.off(SocketEvent.USER_LEFT, handleUserLeft);
            socketService.off(SocketEvent.HOST_CHANGED, handleHostChanged);
            socketService.off(SocketEvent.KICKED, handleKicked);
            socketService.disconnect();
        };
    }, [
        roomId,
        userId,
        room,
        handleConnect,
        handleDisconnect,
        handleUserJoined,
        handleUserLeft,
        handleHostChanged,
        handleKicked
    ]);

    const handleKickUser = (kickUserId: string) => {
        if (userId === room?.hostId) {
            socketService.kickUser(kickUserId);
        }
    };

    const handleLeaveRoom = () => {
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

    // Show connection status if disconnected
    if (!isConnected && !isLoading) {
        return (
            <Container>
                <Box sx={{ mt: 4 }}>
                    <Alert severity="warning">
                        Connection to the server lost. Attempting to reconnect...
                    </Alert>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <CircularProgress size={24} />
                        <Typography
                            variant="body2"
                            color="primary"
                            sx={{ cursor: 'pointer', mt: 2 }}
                            onClick={() => window.location.reload()}
                        >
                            Reload page
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
        </Container>
    );
};

export default RoomPage;